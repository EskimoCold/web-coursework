declare module 'onnxruntime-web' {
  type TypedTensorData =
    | Float32Array
    | Float64Array
    | Int32Array
    | Int16Array
    | Int8Array
    | Uint32Array
    | Uint16Array
    | Uint8Array;

  export class Tensor<TData extends TypedTensorData = Float32Array> {
    constructor(dataType: string, data: TData, dims: readonly number[]);
    readonly data: TData;
    readonly dims: readonly number[];
  }

  export interface InferenceSession {
    readonly inputNames: readonly string[];
    readonly outputNames: readonly string[];
    run(
      feeds: Record<string, Tensor>,
      options?: Record<string, unknown>,
    ): Promise<Record<string, Tensor>>;
  }

  export const InferenceSession: {
    create(
      source: string | Uint8Array,
      options?: { executionProviders?: string[]; graphOptimizationLevel?: string },
    ): Promise<InferenceSession>;
  };

  export const env: {
    wasm: {
      wasmPaths?: string | Record<string, string>;
      numThreads?: number;
      proxy?: boolean;
      simd?: boolean;
    };
  };
}
