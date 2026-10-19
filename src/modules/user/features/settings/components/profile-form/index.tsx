import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIForm from '@/components/ui-form';
import UIFormField from '@/components/ui-form-field';
import UIServerFieldError from '@/components/ui-server-field-error';
import UITypography from '@/components/ui-typography';
import useFocusOnMount from '@/utils/use-focus-on-mount';

import useProfileFormModel from '../../hooks/use-profile-form-model';
import type {
  EmailFieldProps,
  PersonalDetailsProps,
  ProfileFormFieldsProps,
  ProfileFormProps,
  ServerFieldErrorsProps,
} from '../../types/components/profile-form';
import type { FieldErrorReason, ProfileField } from '../../types/user-profile/outcome';
import type { ProfileFormValues } from '../../types/user-profile/profile-form-values';
import ChangePassword from '../change-password';

import ClearButton from './clear-button';
import EmailStatusRow from './email-status-row';
import styles from './styles';

const EMAIL_STATUS_ID = 'email-status';

const ALTERNATING_MARK = '\u200B';

const PROFILE_FIELDS: readonly ProfileField[] = [
  'fullName',
  'email',
  'currentPassword',
  'newPassword',
];

const ERROR_MESSAGES = new Map<FieldErrorReason, string>([
  ['name_rejected', 'sign_up.form.name_input.full_name_format_error'],
  ['email_taken', 'sign_up.errors.email_used'],
  ['email_invalid', 'sign_up.form.email_input.invalid_message'],
  ['password_wrong', 'settings.errors.password_wrong'],
  ['password_not_accepted', 'settings.errors.password_not_accepted'],
  ['new_password_rejected', 'settings.errors.new_password_rejected'],
]);

function ServerFieldErrors({ errors }: ServerFieldErrorsProps): JSX.Element {
  const { t } = useTranslation();
  const first = errors.items[0]?.field;

  return (
    <>
      {PROFILE_FIELDS.map((field) => {
        const reason = errors.items.find((error) => error.field === field)?.reason;
        const key = reason === undefined ? undefined : ERROR_MESSAGES.get(reason);
        return (
          <UIServerFieldError
            key={field}
            name={field}
            message={key === undefined ? null : t(key)}
            focus={field === first}
          />
        );
      })}
    </>
  );
}

function EmailField({ rules, emailRow }: EmailFieldProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <UIFormField<ProfileFormValues>
        name="email"
        label={t('sign_up.form.email_input.label')}
        placeholder={t('sign_up.form.email_input.placeholder')}
        type="email"
        autoComplete="email"
        describedBy={emailRow.confirmed ? undefined : EMAIL_STATUS_ID}
        rules={rules.email}
        sx={styles.field}
      />
      {!emailRow.confirmed && (
        <EmailStatusRow
          statusId={EMAIL_STATUS_ID}
          busy={emailRow.busy}
          onResend={emailRow.resend}
        />
      )}
    </>
  );
}

function PersonalDetails({ rules, refocus, emailRow }: PersonalDetailsProps): JSX.Element {
  const { t } = useTranslation();
  const focusHeading = useFocusOnMount<HTMLHeadingElement>();

  return (
    <>
      <UITypography
        component="h2"
        tabIndex={-1}
        ref={refocus ? focusHeading : undefined}
        sx={styles.sectionTitle}
      >
        {t('settings.profile.sections.personal')}
      </UITypography>
      <UIFormField<ProfileFormValues>
        name="fullName"
        label={t('sign_up.form.name_input.label')}
        placeholder={t('sign_up.form.name_input.placeholder')}
        type="text"
        autoComplete="name"
        rules={rules.fullName}
        sx={styles.field}
      />
      <EmailField rules={rules} emailRow={emailRow} />
    </>
  );
}

function ProfileFormFields({
  rules,
  refocus,
  state,
  emailRow,
}: ProfileFormFieldsProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <PersonalDetails rules={rules} refocus={refocus} emailRow={emailRow} />
      <ChangePassword key={`password-${state.cleared}`} rules={rules} evaluate={rules.evaluate} />
      <ServerFieldErrors key={`errors-${state.attempts}`} errors={state.fieldErrors} />
      <Box component="p" role="status" sx={styles.status}>
        {state.noChanges
          ? `${t('settings.profile.no_changes')}${state.noChangesMarked ? ALTERNATING_MARK : ''}`
          : ''}
      </Box>
    </>
  );
}

export default function ProfileForm(props: ProfileFormProps): JSX.Element {
  const { version, refocus, saveRef } = props;
  const { t } = useTranslation();
  const { save, rules, emailRow, defaults } = useProfileFormModel(props);

  return (
    <UIForm<ProfileFormValues>
      key={version}
      onSubmit={save.save}
      defaultValues={defaults}
      isSubmitting={save.isSubmitting}
      showTitle={false}
      title={null}
      submitLabel={t('settings.profile.save')}
      submittingLabel={t('settings.profile.saving')}
      submitRef={saveRef}
      submitSx={styles.saveButton}
      footer={<ClearButton defaults={defaults} busy={save.isSubmitting} onClear={save.clear} />}
    >
      <ProfileFormFields rules={rules} refocus={refocus} state={save.state} emailRow={emailRow} />
    </UIForm>
  );
}
