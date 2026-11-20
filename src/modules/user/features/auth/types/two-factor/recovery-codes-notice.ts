export interface RecoveryCodesNoticeProps {
  readonly count: number;
  readonly onDismiss: () => void;
}

export type OpenSettingsLinkProps = Pick<RecoveryCodesNoticeProps, 'onDismiss'>;
