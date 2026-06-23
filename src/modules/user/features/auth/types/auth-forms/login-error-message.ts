export interface SerializedError {
  name?: string;
  message?: string;
  stack?: string;
  code?: string;
}

export type Extractor = (error: unknown) => string | null;
