import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock onnxruntime-web so we can unit test without WASM binaries
const { runMock, createMock } = vi.hoisted(() => {
  const run = vi.fn();
  const create = vi.fn();
  return { runMock: run, createMock: create };
});

vi.mock('onnxruntime-web', () => {
  class Tensor<TData = Float32Array> {
    readonly data: TData;
    readonly dims: number[];
    constructor(_type: string, data: TData, dims: number[] = []) {
      this.data = data;
      this.dims = dims;
    }
  }

  const session = { run: runMock };

  createMock.mockResolvedValue(session);

  return {
    Tensor,
    InferenceSession: {
      create: createMock,
    },
    env: { wasm: {} },
  };
});

import { predictExpenses, ExpenseHistoryPoint, __resetPredictorState } from './expensePredictor';

describe('expensePredictor', () => {
  beforeEach(() => {
    runMock.mockReset();
    createMock.mockClear();
    __resetPredictorState();
  });

  it('returns empty forecast when no history provided', async () => {
    const result = await predictExpenses([], 3);
    expect(result).toEqual([]);
    expect(createMock).not.toHaveBeenCalled();
    expect(runMock).not.toHaveBeenCalled();
  });

  it('blends feature-based and ONNX forecasts and increments dates', async () => {
    const history: ExpenseHistoryPoint[] = [
      { date: new Date('2024-01-01'), expense: 100 },
      { date: new Date('2024-01-02'), expense: 120 },
      { date: new Date('2024-01-03'), expense: 90 },
    ];

    // First, capture the feature-only output by forcing ONNX to fail.
    runMock.mockRejectedValueOnce(new Error('no wasm'));
    const featureOnly = await predictExpenses(history, 2);

    __resetPredictorState();
    runMock.mockReset();
    createMock.mockClear();

    runMock.mockResolvedValueOnce({
      Y: { data: new Float32Array([400, 300]) },
    });

    const blended = await predictExpenses(history, 2);

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(blended).toHaveLength(2);

    blended.forEach((point, idx) => {
      expect(point.date.getDate()).toBe(4 + idx);
    });

    expect(blended[0].predictedExpense).toBeGreaterThan(featureOnly[0].predictedExpense);
    expect(blended[0].predictedExpense).toBeLessThan(400);
  });

  it('reuses a single session across multiple calls', async () => {
    const history: ExpenseHistoryPoint[] = [
      { date: new Date('2024-01-01'), expense: 50 },
      { date: new Date('2024-01-02'), expense: 75 },
    ];

    runMock.mockResolvedValue({ Y: { data: new Float32Array([10]) } });

    await predictExpenses(history, 1);
    await predictExpenses(history, 1);

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledTimes(2);
  });

  it('falls back to feature model when ONNX run fails', async () => {
    const history: ExpenseHistoryPoint[] = [
      { date: new Date('2024-01-01'), expense: 200 },
      { date: new Date('2024-01-02'), expense: 180 },
      { date: new Date('2024-01-03'), expense: 220 },
    ];

    runMock.mockRejectedValueOnce(new Error('boom'));

    const result = await predictExpenses(history, 2);

    expect(result).toHaveLength(2);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(result[0].predictedExpense).toBeGreaterThan(0);
  });
});
