export default function getSubmitLabelKey(
  mode: 'sign_in' | 'sign_up',
  isSubmitting: boolean
): string {
  return isSubmitting ? `${mode}.form.submitting` : `${mode}.form.submit_button`;
}
