import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { type JSX, useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  NotificationContentActionProps,
  NotificationContentCloseProps,
  NotificationContentTextProps,
  UINotificationContentProps,
} from '@/components/types/ui-notification-content';
import i18n from '@/i18n';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';

import en from './i18n/en.json';
import uk from './i18n/uk.json';
import NotificationIcon from './notification-icon';
import styles from './styles';

lazyCatalogLoader.register(i18n, { en, uk });

function ContentAction({ action }: NotificationContentActionProps): JSX.Element {
  return (
    <Box component="button" type="button" sx={styles.action} onClick={action.onActivate}>
      {action.label}
    </Box>
  );
}

function ContentClose({
  id,
  describedBy,
  closeRef,
  onClose,
}: NotificationContentCloseProps): JSX.Element {
  const { t } = useTranslation();
  const close = useCallback((): void => onClose(id), [id, onClose]);

  return (
    <IconButton
      ref={closeRef}
      aria-label={t('ui_notification.close')}
      aria-describedby={describedBy}
      sx={styles.close}
      onClick={close}
    >
      <NotificationIcon kind="close" />
    </IconButton>
  );
}

function ContentText({ view, messageId }: NotificationContentTextProps): JSX.Element {
  return (
    <>
      <Box component="span" sx={styles.icon}>
        <NotificationIcon kind={view.kind} />
      </Box>
      <Box component="span" id={messageId} sx={styles.message}>
        {view.message}
      </Box>
      {view.time === undefined ? null : (
        <Box component="span" sx={styles.time}>
          {view.time}
        </Box>
      )}
    </>
  );
}

export default function UINotificationContent({
  view,
  onClose,
  closeRef,
}: UINotificationContentProps): JSX.Element {
  const messageId = useId();
  const { action } = view;

  return (
    <Box sx={styles.root}>
      <ContentText view={view} messageId={messageId} />
      {action === undefined ? null : <ContentAction action={action} />}
      <ContentClose id={view.id} describedBy={messageId} closeRef={closeRef} onClose={onClose} />
    </Box>
  );
}
