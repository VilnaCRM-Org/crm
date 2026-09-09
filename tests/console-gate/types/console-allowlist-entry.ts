export interface ConsoleAllowlistExpiry {
  packageName: string;
  removedInMajor: number;
}

export interface ConsoleAllowlistEntry {
  pattern: RegExp;
  reason: string;
  expiresWith: ConsoleAllowlistExpiry;
}
