import type { JSX } from 'react';
import type { FieldValues } from 'react-hook-form';

import UIForm from '@/components/ui-form';

import type { ConfirmationFormViewProps } from '../../types/components/two-factor-settings';

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
      title={form.title}
      titleComponent="h3"
      titleRef={form.titleRef}
      subtitle={form.subtitle}
      submitLabel={form.submitLabel}
      submittingLabel={form.submittingLabel}
      submitBlockedReason={form.submitBlockedReason}
      footer={footer}
    >
      {children}
    </UIForm>
  );
}
