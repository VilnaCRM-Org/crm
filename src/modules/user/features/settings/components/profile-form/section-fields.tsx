import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIFormField from '@/components/ui-form-field';
import UIPasswordField from '@/components/ui-password-field';

import useEmailRow from '../../hooks/use-email-row';
import useSectionReveal from '../../hooks/use-section-reveal';
import type {
  EmailFieldProps,
  EmailStatusProps,
  FullNameFieldProps,
  ProfileSectionFieldsProps,
  RevealedSectionFieldsProps,
  SaveHintProps,
  SectionPasswordProps,
} from '../../types/components/profile-form';
import type { ProfileFormValues } from '../../types/user-profile/profile-form-values';
import type { RevealedProfileSection } from '../../types/user-profile/profile-section';
import ChangePassword from '../change-password';

import EmailStatusRow from './email-status-row';
import styles from './styles';

const EMAIL_STATUS_ID = 'email-status';
const NAME_HINT_ID = 'full-name-save-hint';
const EMAIL_HINT_ID = 'email-save-hint';

const PASSWORD_LABELS: Record<RevealedProfileSection, string> = {
  fullName: 'settings.profile.full_name_password',
  email: 'settings.profile.email_password',
};

const PASSWORD_FIELDS: Record<RevealedProfileSection, 'fullNamePassword' | 'emailPassword'> = {
  fullName: 'fullNamePassword',
  email: 'emailPassword',
};

function SaveHint({ id }: SaveHintProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box component="span" id={id} sx={styles.visuallyHidden}>
      {t('settings.profile.save_needs_password')}
    </Box>
  );
}

function SectionPassword({ section, rules, busy }: SectionPasswordProps): JSX.Element {
  const { t } = useTranslation();
  const field = PASSWORD_FIELDS[section];

  return (
    <UIPasswordField<ProfileFormValues>
      name={field}
      label={t(PASSWORD_LABELS[section])}
      placeholder={t('sign_in.form.password_input.placeholder')}
      autoComplete="current-password"
      rules={rules[field]}
      readOnly={busy}
      sx={styles.field}
    />
  );
}

function RevealedPassword({
  context,
  section,
  rules,
  save,
  onChange,
}: RevealedSectionFieldsProps): JSX.Element | null {
  const { user } = context;
  const changed = useSectionReveal({ section, user, changes: save.changes, onChange });

  return changed ? (
    <SectionPassword section={section} rules={rules} busy={save.isSubmitting} />
  ) : null;
}

function FullNameField({ rules, busy }: FullNameFieldProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <UIFormField<ProfileFormValues>
        name="fullName"
        label={t('settings.profile.full_name')}
        placeholder={t('sign_up.form.name_input.placeholder')}
        type="text"
        autoComplete="name"
        describedBy={NAME_HINT_ID}
        rules={rules.fullName}
        inputProps={{ readOnly: busy }}
        sx={styles.field}
      />
      <SaveHint id={NAME_HINT_ID} />
    </>
  );
}

function EmailStatus({ context, busy }: EmailStatusProps): JSX.Element | null {
  const emailRow = useEmailRow(context, busy);

  return emailRow.confirmed ? null : (
    <EmailStatusRow statusId={EMAIL_STATUS_ID} busy={emailRow.busy} onResend={emailRow.resend} />
  );
}

function EmailField({ context, rules, busy }: EmailFieldProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <UIFormField<ProfileFormValues>
        name="email"
        label={t('sign_up.form.email_input.label')}
        placeholder={t('sign_up.form.email_input.placeholder')}
        type="email"
        autoComplete="email"
        describedBy={context.user.confirmed ? EMAIL_HINT_ID : `${EMAIL_HINT_ID} ${EMAIL_STATUS_ID}`}
        rules={rules.email}
        inputProps={{ readOnly: busy }}
        sx={styles.field}
      />
      <SaveHint id={EMAIL_HINT_ID} />
      <EmailStatus context={context} busy={busy} />
    </>
  );
}

export default function SectionFields({
  context,
  section,
  rules,
  save,
  onChange,
}: ProfileSectionFieldsProps): JSX.Element {
  if (section === 'password') {
    return (
      <ChangePassword
        key={`password-${save.state.cleared}`}
        rules={rules}
        evaluate={rules.evaluate}
        busy={save.isSubmitting}
      />
    );
  }
  const busy = save.isSubmitting;

  return (
    <>
      {section === 'fullName' ? (
        <FullNameField rules={rules} busy={busy} />
      ) : (
        <EmailField context={context} rules={rules} busy={busy} />
      )}
      <RevealedPassword
        context={context}
        section={section}
        rules={rules}
        save={save}
        onChange={onChange}
      />
    </>
  );
}
