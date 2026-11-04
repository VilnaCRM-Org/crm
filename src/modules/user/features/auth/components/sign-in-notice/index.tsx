import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box } from '@mui/material';
import { type JSX, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  SignInNoticeMessageTable,
  SignInNoticeProps,
} from '@auth/types/components/sign-in-notice';

import styles from './styles';

const NOTICE_ROWS: SignInNoticeMessageTable = {
  password_reset: {
    messageKey: 'sign_in.notices.password_reset',
    tone: 'success',
    Icon: CheckCircleOutlinedIcon,
  },
  session_ended: {
    messageKey: 'sign_in.notices.session_ended',
    tone: 'neutral',
    Icon: InfoOutlinedIcon,
  },
  two_factor_expired: {
    messageKey: 'sign_in.notices.two_factor_expired',
    tone: 'neutral',
    Icon: InfoOutlinedIcon,
  },
  account_locked: {
    messageKey: 'sign_in.notices.account_locked',
    tone: 'neutral',
    Icon: InfoOutlinedIcon,
  },
};

export default function SignInNotice({ notice }: SignInNoticeProps): JSX.Element | null {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  useEffect(() => {
    if (notice !== null) setText(t(NOTICE_ROWS[notice].messageKey));
  }, [notice, t]);

  if (notice === null) return null;
  const { Icon, tone } = NOTICE_ROWS[notice];
  return (
    <Box component="p" role="status" sx={[styles.notice, styles.tones[tone]]}>
      <Icon aria-hidden="true" sx={styles.icon} />
      <span>{text}</span>
    </Box>
  );
}
