import Box from '@mui/material/Box';
import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';

import UIForm from '@/components/ui-form';
import UIServerFieldError from '@/components/ui-server-field-error';
import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';

import useCollapseFocus from '../../hooks/use-collapse-focus';
import useProfileFormModel from '../../hooks/use-profile-form-model';
import type {
  ProfileSectionFormProps,
  SectionBodyProps,
  SectionClearProps,
  SectionErrorField,
  SectionForm,
  SectionOfflineNotices,
  ServerFieldErrorsProps,
} from '../../types/components/profile-form';
import type { ProfileEditContext } from '../../types/hooks/use-profile-save';
import type { FieldErrorReason } from '../../types/user-profile/outcome';
import type { ProfileFormValues } from '../../types/user-profile/profile-form-values';
import type { ProfileSection } from '../../types/user-profile/profile-section';

import ClearButton from './clear-button';
import SectionFields from './section-fields';
import styles from './styles';

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

const SAVE_LABELS: Record<ProfileSection, string> = {
  fullName: 'settings.profile.save_name',
  email: 'settings.profile.save_email',
  password: 'settings.profile.save',
};

const OFFLINE_NOTICES: Record<ProfileSection, SectionOfflineNotices> = {
  fullName: { clean: 'none', revealed: 'inline' },
  email: { clean: 'none', revealed: 'inline' },
  password: { clean: 'live', revealed: 'live' },
};

const ERROR_MESSAGES = new Map<FieldErrorReason, string>([
  ['name_rejected', 'sign_up.form.name_input.full_name_format_error'],
  ['email_taken', 'sign_up.errors.email_used'],
  ['email_invalid', 'sign_up.form.email_input.invalid_message'],
  ['password_wrong', 'settings.errors.password_wrong'],
  ['password_not_accepted', 'settings.errors.password_not_accepted'],
  ['new_password_rejected', 'settings.errors.new_password_rejected'],
]);

function ServerFieldErrors({ section, errors, occurrence }: ServerFieldErrorsProps): JSX.Element {
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

function SectionBody({ context, section, model, onChange }: SectionBodyProps): JSX.Element {
  const { t } = useTranslation();
  const { save, rules } = model;
  const { state } = save;

  return (
    <>
      <SectionFields
        context={context}
        section={section}
        rules={rules}
        save={save}
        onChange={onChange}
      />
      <ServerFieldErrors section={section} errors={state.fieldErrors} occurrence={state.attempts} />
      {section === 'password' && <Box aria-hidden="true" sx={styles.actionsDivider} />}
      <Box component="p" role="status" sx={styles.status}>
        {state.noChanges
          ? `${t('settings.profile.no_changes')}${state.noChangesMarked ? ALTERNATING_MARK : ''}`
          : ''}
      </Box>
    </>
  );
}

function SectionClear({ model, revealed }: SectionClearProps): JSX.Element | null {
  const { save, defaults } = model;

  return revealed ? (
    <ClearButton defaults={defaults} busy={save.isSubmitting} onClear={save.clear} />
  ) : null;
}

function useSectionForm(context: ProfileEditContext, section: ProfileSection): SectionForm {
  const { t } = useTranslation();
  const [changed, setChanged] = useState(false);
  useCollapseFocus(section, changed);
  const revealed = section === 'password' || changed;

  return {
    model: useProfileFormModel(context, section),
    revealed,
    onChange: setChanged,
    submitLabel: t(SAVE_LABELS[section]),
    submittingLabel: t('settings.profile.saving'),
    submitSx: revealed ? styles.saveButton : styles.saveButtonHidden,
    offlineNotice: OFFLINE_NOTICES[section][revealed ? 'revealed' : 'clean'],
  };
}

export default function ProfileSectionForm({
  context,
  section,
}: ProfileSectionFormProps): JSX.Element {
  const form = useSectionForm(context, section);
  const { save, defaults } = form.model;

  return (
    <UIForm<ProfileFormValues>
      key={save.state.saved}
      onSubmit={save.save}
      onInvalid={save.block}
      defaultValues={defaults}
      isSubmitting={save.isSubmitting}
      title={null}
      submitLabel={form.submitLabel}
      submittingLabel={form.submittingLabel}
      submitRef={save.buttonRef}
      submitSx={form.submitSx}
      offlineNotice={form.offlineNotice}
      footer={<SectionClear model={form.model} revealed={form.revealed} />}
    >
      <SectionBody
        context={context}
        section={section}
        model={form.model}
        onChange={form.onChange}
      />
    </UIForm>
  );
}
