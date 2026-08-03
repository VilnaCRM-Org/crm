import failOnConsole from 'jest-fail-on-console';

import CONSOLE_ALLOWLIST from './allowlist';

let installed = false;

export function isConsoleAllowed(message: string): boolean {
  return CONSOLE_ALLOWLIST.some((entry) => entry.pattern.test(message));
}

export function installConsoleGate({ failOnWarn = true }: { failOnWarn?: boolean } = {}): void {
  if (installed) {
    return;
  }
  installed = true;

  failOnConsole({
    shouldFailOnError: true,
    shouldFailOnWarn: failOnWarn,
    allowMessage: isConsoleAllowed,
  });
}

export default installConsoleGate;
