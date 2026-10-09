export interface ValidationMessage {
  readonly text: string;
}

export interface ValidationMessageSet {
  readonly items: readonly ValidationMessage[];
}
