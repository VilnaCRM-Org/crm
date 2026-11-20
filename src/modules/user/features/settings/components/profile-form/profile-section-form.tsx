import Box from '@mui/material/Box';
import { type JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIForm from '@/components/ui-form';
import UINotificationSlot from '@/components/ui-notification-slot';
import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';

import type {
  ProfileSectionFormProps,
  SectionBodyProps,
  SectionFooterProps,
} from '../../types/components/profile-form';
import type { ProfileFormValues } from '../../types/user-profile/profile-form-values';

import ClearButton from './clear-button';
import SectionFields from './section-fields';
import ServerFieldErrors from './server-field-errors';
import styles from './styles';
import useSectionForm from './use-section-form';

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

function SectionFooter({ model, revealed }: SectionFooterProps): JSX.Element {
  const { save, defaults } = model;

  return (
    <>
      {revealed && (
        <ClearButton defaults={defaults} busy={save.isSubmitting} onClear={save.clear} />
      )}
      <UINotificationSlot anchor={save.anchor} />
    </>
  );
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
      footer={<SectionFooter model={form.model} revealed={form.revealed} />}
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
