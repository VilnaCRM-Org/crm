import type { FormState, LabelKey, Mode } from './get-submit-label-key.types';

export default function getSubmitLabelKey(mode: Mode, isSubmitting: boolean): LabelKey {
  const state: FormState = isSubmitting ? 'submitting' : 'submit_button';
  return `${mode}.form.${state}` as LabelKey;
}
