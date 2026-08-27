import failOnConsole from 'jest-fail-on-console';

import CONSOLE_ALLOWLIST from './allowlist';
import type { ConsoleAllowlistEntry } from './types/console-allowlist-entry';

let installed = false;

export function isConsoleAllowedBy(message: string, entries: ConsoleAllowlistEntry[]): boolean {
  return entries.some((entry) => {
    const match = new RegExp(entry.pattern.source, entry.pattern.flags.replace(/[gy]/g, '')).exec(
      message
    );

    return match !== null && match[0] === message;
  });
}

export function isConsoleAllowed(message: string): boolean {
  return isConsoleAllowedBy(message, CONSOLE_ALLOWLIST);
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
