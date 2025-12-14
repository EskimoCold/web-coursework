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

let sessionPromise: Promise<ort.InferenceSession> | null = null;
let mutex: Promise<void> = Promise.resolve();

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

  const outputData = await runExclusive(async () => {
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

  return outputData.map((value, idx) => {
    const forecastDate = new Date(latest.date);
    forecastDate.setHours(0, 0, 0, 0);
    forecastDate.setDate(forecastDate.getDate() + idx + 1);

    return {
      date: forecastDate,
      predictedExpense: Math.max(0, Math.round(value)),
    };
  });
};
