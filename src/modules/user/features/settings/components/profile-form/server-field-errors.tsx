import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIServerFieldError from '@/components/ui-server-field-error';

import type {
  SectionErrorField,
  ServerFieldErrorsProps,
} from '../../types/components/profile-form';
import type { FieldErrorReason } from '../../types/user-profile/outcome';
import type { ProfileSection } from '../../types/user-profile/profile-section';

const SECTION_ERROR_FIELDS: Record<ProfileSection, readonly SectionErrorField[]> = {
  fullName: [
    { error: 'fullName', field: 'fullName' },
    { error: 'currentPassword', field: 'fullNamePassword' },
  ],
  email: [
    { error: 'email', field: 'email' },
    { error: 'currentPassword', field: 'emailPassword' },
  ],
  password: [
    { error: 'currentPassword', field: 'currentPassword' },
    { error: 'newPassword', field: 'newPassword' },
  ],
};

const ERROR_MESSAGES = new Map<FieldErrorReason, string>([
  ['name_rejected', 'sign_up.form.name_input.full_name_format_error'],
  ['email_taken', 'sign_up.errors.email_used'],
  ['email_invalid', 'sign_up.form.email_input.invalid_message'],
  ['password_wrong', 'settings.errors.password_wrong'],
  ['password_not_accepted', 'settings.errors.password_not_accepted'],
  ['new_password_rejected', 'settings.errors.new_password_rejected'],
]);

export default function ServerFieldErrors({
  section,
  errors,
  occurrence,
}: ServerFieldErrorsProps): JSX.Element {
  const { t } = useTranslation();
  const fields = SECTION_ERROR_FIELDS[section];
  const first = fields.find(({ error }) => errors.items.some((item) => item.field === error));

  return (
    <>
      {fields.map((entry) => {
        const reason = errors.items.find((item) => item.field === entry.error)?.reason;
        const key = reason === undefined ? undefined : ERROR_MESSAGES.get(reason);
        return (
          <UIServerFieldError
            key={entry.field}
            name={entry.field}
            message={key === undefined ? null : t(key)}
            occurrence={occurrence}
            focus={entry === first}
          />
        );
      })}
    </>
  );
}
