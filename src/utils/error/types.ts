export default interface ParsedError {
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
}
