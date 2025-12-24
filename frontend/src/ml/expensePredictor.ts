/* eslint-disable import/namespace */
import * as ort from 'onnxruntime-web';

export interface ExpenseHistoryPoint {
  date: Date;
  expense: number;
}

export interface ExpenseForecastPoint {
  date: Date;
  predictedExpense: number;
}

const MODEL_PATH = '/models/expense_predictor.onnx';
const FEATURE_WINDOW = 5;
const BOOSTING_LEARNING_RATE = 0.4;
const MAX_STUMPS = 3;
const RIDGE_L2 = 1e-2;

let sessionPromise: Promise<ort.InferenceSession> | null = null;
let mutex: Promise<void> = Promise.resolve();

interface FeatureRow {
  features: number[];
  target: number;
}

interface DecisionStump {
  featureIndex: number;
  threshold: number;
  leftValue: number;
  rightValue: number;
  gain: number;
}

export const __resetPredictorState = () => {
  sessionPromise = null;
  mutex = Promise.resolve();
};

const loadSession = async (): Promise<ort.InferenceSession> => {
  if (!sessionPromise) {
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    sessionPromise = ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    }).catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }

  return sessionPromise;
};

const runExclusive = async <T>(fn: () => Promise<T>): Promise<T> => {
  let release: () => void = () => {};
  const prev = mutex;
  mutex = new Promise<void>((resolve) => {
    release = resolve;
  });

  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
};

const mean = (values: number[]): number =>
  values.reduce((acc, val) => acc + val, 0) / Math.max(values.length, 1);

const stdDev = (values: number[]): number => {
  if (values.length < 2) return 0;
  const valuesMean = mean(values);
  const variance = mean(values.map((v) => (v - valuesMean) ** 2));
  return Math.sqrt(variance);
};

const computeDayOfWeekBaselines = (history: ExpenseHistoryPoint[], fallback: number): number[] => {
  const totals = Array<number>(7).fill(0);
  const counts = Array<number>(7).fill(0);

  history.forEach((point) => {
    const dow = point.date.getDay();
    totals[dow] += point.expense;
    counts[dow] += 1;
  });

  return totals.map((total, idx) => (counts[idx] ? total / counts[idx] : fallback));
};

const buildFeatureVector = (
  date: Date,
  previousExpenses: number[],
  avgExpense: number,
  dayOfWeekBaselines: number[],
  totalCount: number,
): number[] => {
  const scale = Math.max(avgExpense, 1);
  const lastExpense = previousExpenses.at(-1) ?? avgExpense;
  const penultimateExpense = previousExpenses.at(-2) ?? lastExpense;
  const rollingWindow = previousExpenses.slice(-FEATURE_WINDOW);
  const rollingMean = rollingWindow.length ? mean(rollingWindow) : avgExpense;
  const rollingStd = rollingWindow.length ? stdDev(rollingWindow) : 0;
  const momentum = lastExpense - penultimateExpense;
  const trend =
    previousExpenses.length > 1
      ? (lastExpense - previousExpenses[0]) / Math.max(1, previousExpenses.length - 1)
      : 0;
  const seasonality = dayOfWeekBaselines[date.getDay()] ?? avgExpense;
  const normalizedIndex = previousExpenses.length / Math.max(1, totalCount);

  return [
    1,
    lastExpense / scale,
    rollingMean / scale,
    momentum / scale,
    rollingStd / scale,
    trend / scale,
    seasonality / scale,
    (lastExpense - seasonality) / scale,
    date.getDay() / 6,
    (date.getDate() - 1) / 30,
    normalizedIndex,
  ];
};

const solveLinearSystem = (matrix: number[][], vector: number[]): number[] => {
  const size = vector.length;
  const augmented = matrix.map((row, idx) => [...row, vector[idx]]);

  for (let col = 0; col < size; col++) {
    let pivot = col;
    for (let row = col + 1; row < size; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivot][col])) {
        pivot = row;
      }
    }

    if (Math.abs(augmented[pivot][col]) < 1e-12) {
      return [];
    }

    [augmented[col], augmented[pivot]] = [augmented[pivot], augmented[col]];

    const divisor = augmented[col][col];
    for (let c = col; c <= size; c++) {
      augmented[col][c] /= divisor;
    }

    for (let row = 0; row < size; row++) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let c = col; c <= size; c++) {
        augmented[row][c] -= factor * augmented[col][c];
      }
    }
  }

  return augmented.map((row) => row[size]);
};

const trainRidgeRegression = (rows: FeatureRow[], l2 = RIDGE_L2): number[] => {
  if (!rows.length) return [];

  const nFeatures = rows[0].features.length;
  const xtx: number[][] = Array.from({ length: nFeatures }, () => Array(nFeatures).fill(0));
  const xty: number[] = Array(nFeatures).fill(0);

  rows.forEach(({ features, target }) => {
    features.forEach((value, i) => {
      xty[i] += value * target;
      features.forEach((valueJ, j) => {
        xtx[i][j] += value * valueJ;
      });
    });
  });

  for (let i = 0; i < nFeatures; i++) {
    xtx[i][i] += l2;
  }

  const weights = solveLinearSystem(xtx, xty);
  if (weights.length === nFeatures) {
    return weights;
  }

  const targetMean = mean(rows.map((row) => row.target));
  const fallback = Array<number>(nFeatures).fill(0);
  fallback[0] = targetMean;
  return fallback;
};

const predictLinear = (weights: number[], features: number[]): number =>
  features.reduce((acc, value, idx) => acc + value * (weights[idx] ?? 0), 0);

const predictStump = (stump: DecisionStump, features: number[]): number =>
  features[stump.featureIndex] <= stump.threshold ? stump.leftValue : stump.rightValue;

const fitBestStump = (
  dataset: FeatureRow[],
  residuals: number[],
  baseError: number,
): DecisionStump | null => {
  if (!dataset.length) return null;
  const nFeatures = dataset[0].features.length;
  let best: DecisionStump | null = null;

  for (let featureIndex = 0; featureIndex < nFeatures; featureIndex++) {
    const featureValues = dataset.map((row) => row.features[featureIndex]);
    const uniqueThresholds = Array.from(new Set(featureValues)).sort((a, b) => a - b);

    for (const threshold of uniqueThresholds) {
      let leftSum = 0;
      let leftCount = 0;
      let rightSum = 0;
      let rightCount = 0;

      residuals.forEach((residual, idx) => {
        if (dataset[idx].features[featureIndex] <= threshold) {
          leftSum += residual;
          leftCount += 1;
        } else {
          rightSum += residual;
          rightCount += 1;
        }
      });

      const leftValue = leftCount ? leftSum / leftCount : 0;
      const rightValue = rightCount ? rightSum / rightCount : 0;

      let error = 0;
      residuals.forEach((residual, idx) => {
        const predicted = dataset[idx].features[featureIndex] <= threshold ? leftValue : rightValue;
        const diff = residual - predicted;
        error += diff * diff;
      });

      const gain = baseError - error;
      if (!best || gain > best.gain) {
        best = { featureIndex, threshold, leftValue, rightValue, gain };
      }
    }
  }

  if (!best || best.gain <= baseError * 0.01) {
    return null;
  }

  return best;
};

const trainBoosting = (
  dataset: FeatureRow[],
  basePredictions: number[],
  learningRate = BOOSTING_LEARNING_RATE,
  maxStumps = MAX_STUMPS,
): DecisionStump[] => {
  const stumps: DecisionStump[] = [];
  let predictions = [...basePredictions];

  for (let i = 0; i < maxStumps; i++) {
    const residuals = dataset.map((row, idx) => row.target - predictions[idx]);
    const baseError = residuals.reduce((acc, r) => acc + r * r, 0);
    if (!baseError) break;

    const stump = fitBestStump(dataset, residuals, baseError);
    if (!stump) break;

    stumps.push(stump);
    predictions = predictions.map(
      (value, idx) => value + learningRate * predictStump(stump, dataset[idx].features),
    );
  }

  return stumps;
};

const buildFeatureDataset = (
  history: ExpenseHistoryPoint[],
  avgExpense: number,
  dayOfWeekBaselines: number[],
  totalCount: number,
): FeatureRow[] => {
  const expenses = history.map((point) => point.expense);

  return history.map((point, idx) => ({
    features: buildFeatureVector(
      point.date,
      expenses.slice(0, idx),
      avgExpense,
      dayOfWeekBaselines,
      totalCount,
    ),
    target: point.expense,
  }));
};

const forecastWithFeatureModel = (history: ExpenseHistoryPoint[], horizon: number): number[] => {
  const avgExpense = mean(history.map((p) => p.expense));
  const totalCount = history.length + horizon;
  const dayOfWeekBaselines = computeDayOfWeekBaselines(history, avgExpense);
  const dataset = buildFeatureDataset(history, avgExpense, dayOfWeekBaselines, totalCount);

  const weights = trainRidgeRegression(dataset);
  const basePredictions = dataset.map((row) => predictLinear(weights, row.features));
  const stumps = trainBoosting(dataset, basePredictions);

  const latestDate = history[history.length - 1].date;
  const syntheticExpenses = history.map((p) => p.expense);
  const forecasts: number[] = [];

  for (let i = 0; i < horizon; i++) {
    const nextDate = new Date(latestDate);
    nextDate.setHours(0, 0, 0, 0);
    nextDate.setDate(nextDate.getDate() + i + 1);

    const features = buildFeatureVector(
      nextDate,
      syntheticExpenses,
      avgExpense,
      dayOfWeekBaselines,
      totalCount,
    );

    let prediction = predictLinear(weights, features);
    stumps.forEach((stump) => {
      prediction += BOOSTING_LEARNING_RATE * predictStump(stump, features);
    });

    const lastExpense = syntheticExpenses.at(-1) ?? avgExpense;
    const blended = 0.6 * prediction + 0.25 * lastExpense + 0.15 * avgExpense;
    const safePrediction = Math.max(0, blended);

    forecasts.push(safePrediction);
    syntheticExpenses.push(safePrediction);
  }

  return forecasts;
};

const runOnnxForecast = async (
  history: ExpenseHistoryPoint[],
  horizon: number,
  avgExpense: number,
  trend: number,
): Promise<number[]> => {
  const latest = history[history.length - 1];

  return runExclusive(async () => {
    const session = await loadSession();
    const input = new Float32Array(horizon * 3);

    for (let i = 0; i < horizon; i++) {
      const nextDay = new Date(latest.date);
      nextDay.setHours(0, 0, 0, 0);
      nextDay.setDate(nextDay.getDate() + i + 1);

      const projected = Math.max(0, latest.expense + trend * (i + 1));
      const dayOfWeekNormalized = nextDay.getDay() / 6;
      const offset = i * 3;

      input[offset] = projected;
      input[offset + 1] = avgExpense;
      input[offset + 2] = dayOfWeekNormalized;
    }

    const results = await session.run({
      X: new ort.Tensor('float32', input, [horizon, 3]),
    });

    const output = (results.Y ?? Object.values(results)[0]) as ort.Tensor<Float32Array>;
    return Array.from(output.data);
  });
};

const blendForecasts = (featureForecast: number[], onnxForecast: number[] | null): number[] => {
  if (!onnxForecast?.length) return featureForecast;

  const maxLength = Math.max(featureForecast.length, onnxForecast.length);
  const blended: number[] = [];

  for (let i = 0; i < maxLength; i++) {
    const featureValue = featureForecast[i] ?? featureForecast.at(-1) ?? 0;
    const onnxValue = onnxForecast[i] ?? onnxForecast.at(-1) ?? featureValue;
    blended.push(Math.max(0, 0.55 * featureValue + 0.45 * onnxValue));
  }

  return blended;
};

export const predictExpenses = async (
  history: ExpenseHistoryPoint[],
  horizon = 7,
): Promise<ExpenseForecastPoint[]> => {
  if (!history.length) return [];

  const sortedHistory = [...history]
    .filter((item) => Number.isFinite(item.expense))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const expenses = sortedHistory.map((p) => p.expense);
  const latest = sortedHistory[sortedHistory.length - 1];
  const avgExpense = expenses.reduce((acc, val) => acc + val, 0) / expenses.length;
  const trend =
    expenses.length > 1
      ? (expenses[expenses.length - 1] - expenses[0]) / Math.max(1, expenses.length - 1)
      : 0;

  const featureForecast = forecastWithFeatureModel(sortedHistory, horizon);
  let onnxForecast: number[] | null = null;

  try {
    onnxForecast = await runOnnxForecast(sortedHistory, horizon, avgExpense, trend);
  } catch {
    //
  }

  const blended = blendForecasts(featureForecast, onnxForecast);

  return blended.map((value, idx) => {
    const forecastDate = new Date(latest.date);
    forecastDate.setHours(0, 0, 0, 0);
    forecastDate.setDate(forecastDate.getDate() + idx + 1);

    return {
      date: forecastDate,
      predictedExpense: Math.max(0, Math.round(value)),
    };
  });
};
