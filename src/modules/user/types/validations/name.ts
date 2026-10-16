export interface NameRule {
  check: (value: string) => boolean;
  messageKey: string;
}
