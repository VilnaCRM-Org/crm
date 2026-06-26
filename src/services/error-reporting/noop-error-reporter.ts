import { injectable } from 'tsyringe';

import type { ErrorReporter } from '@/services/types/error-reporting';

@injectable()
export default class NoopErrorReporter implements ErrorReporter {
  public report(): void {}
}

export const noopErrorReporter = new NoopErrorReporter();
