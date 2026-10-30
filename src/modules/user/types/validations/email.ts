export interface Rule {
  check: (email: string) => boolean;
  messageKey: string;
}
