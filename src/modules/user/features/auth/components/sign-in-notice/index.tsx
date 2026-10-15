import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { Box } from '@mui/material';
import { type JSX, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  SignInNoticeMessageTable,
  SignInNoticeProps,
} from '@auth/types/components/sign-in-notice';

import styles from './styles';

const PASSWORD_RESET_NOTICE_KEY = 'sign_in.notices.password_reset';

const NOTICE_MESSAGES: SignInNoticeMessageTable = {
  password_reset: PASSWORD_RESET_NOTICE_KEY,
};

export default function SignInNotice({ notice }: SignInNoticeProps): JSX.Element | null {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  useEffect(() => {
    if (notice !== null) setText(t(NOTICE_MESSAGES[notice]));
  }, [notice, t]);

  if (notice === null) return null;
  return (
    <Box component="p" role="status" sx={styles.notice}>
      <CheckCircleOutlinedIcon aria-hidden="true" sx={styles.icon} />
      <span>{text}</span>
    </Box>
  );
}
