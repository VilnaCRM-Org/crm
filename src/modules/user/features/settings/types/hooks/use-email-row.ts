export interface EmailRowState {
  readonly confirmed: boolean;
  readonly busy: boolean;
  readonly resending: boolean;
  readonly resend: () => void;
}
