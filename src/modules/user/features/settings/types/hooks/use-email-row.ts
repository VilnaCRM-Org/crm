export interface EmailRowState {
  readonly confirmed: boolean;
  readonly busy: boolean;
  readonly resend: () => void;
}
