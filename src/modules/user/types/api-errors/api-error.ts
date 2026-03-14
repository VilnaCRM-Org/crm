export default class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly cause?: unknown
  ) {
    super(message);
    const stackClassName = new.target.name;
    this.name = 'ApiError';

    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);

      // Preserve ApiError as a public name, but keep stack headers specific
      // to subclasses for easier debugging and stable test expectations.
      if (stackClassName !== this.name && this.stack) {
        const [firstLine, ...rest] = this.stack.split('\n');

        if (firstLine.startsWith(`${this.name}:`)) {
          this.stack = [`${stackClassName}: ${this.message}`, ...rest].join('\n');
        }
      }
    }
  }
}
