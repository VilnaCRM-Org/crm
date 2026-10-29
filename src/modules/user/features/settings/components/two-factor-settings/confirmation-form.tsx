import type { JSX } from 'react';
import type { FieldValues } from 'react-hook-form';

import UIForm from '@/components/ui-form';

import type { ConfirmationFormViewProps } from '../../types/components/two-factor-settings';

import styles from './styles';

export default function ConfirmationForm<T extends FieldValues>({
  form,
  isSubmitting,
  footer,
  children,
}: ConfirmationFormViewProps<T>): JSX.Element {
  return (
    <UIForm<T>
      onSubmit={form.onSubmit}
      defaultValues={form.defaultValues}
      isSubmitting={isSubmitting}
      error={form.error}
      errorAction={form.errorAction}
      errorOccurrence={form.errorOccurrence}
      submitRef={form.submitRef}
      title={form.title}
      titleComponent="h3"
      titleRef={form.titleRef}
      subtitle={form.subtitle}
      submitLabel={form.submitLabel}
      submittingLabel={form.submittingLabel}
      submitBlockedReason={form.submitBlockedReason}
      submitSx={styles.submit}
      footer={footer}
    >
      {children}
    </UIForm>
  );
}
