import Box from '@mui/material/Box';
import { type JSX, type KeyboardEvent, useId } from 'react';
import { useTranslation } from 'react-i18next';

import UIButton from '@/components/ui-button';
import useFocusOnMount from '@/utils/use-focus-on-mount';

import type {
  SocialUnlinkActionsProps,
  SocialUnlinkConfirmationProps,
} from '../../types/components/social-networks';

import styles from './styles';

function UnlinkActions(props: SocialUnlinkActionsProps): JSX.Element {
  const { t } = useTranslation();
  const focusOnMount = useFocusOnMount<HTMLButtonElement>();

  return (
    <Box sx={styles.confirmationActions}>
      <UIButton
        ref={focusOnMount}
        variant="outlinedPill"
        aria-describedby={props.questionId}
        sx={styles.confirmationButton}
        onClick={props.onCancel}
      >
        {t('settings.social.unlink_cancel')}
      </UIButton>
      <UIButton
        variant="outlinedPill"
        aria-describedby={props.questionId}
        aria-disabled={props.busy}
        sx={styles.confirmationButton}
        onClick={props.onConfirm}
      >
        {t('settings.social.unlink_confirm')}
      </UIButton>
    </Box>
  );
}

export default function SocialUnlinkConfirmation({
  label,
  busy,
  onCancel,
  onConfirm,
}: SocialUnlinkConfirmationProps): JSX.Element {
  const { t } = useTranslation();
  const questionId = useId();
  const cancelOnEscape = ({ key }: KeyboardEvent): void => {
    if (key === 'Escape') onCancel();
  };

  return (
    <Box
      role="group"
      aria-labelledby={questionId}
      sx={styles.confirmation}
      onKeyDown={cancelOnEscape}
    >
      <Box component="p" id={questionId} sx={styles.failureMessage}>
        {t('settings.social.unlink_question', { provider: label })}
      </Box>
      <UnlinkActions
        questionId={questionId}
        busy={busy}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </Box>
  );
}
