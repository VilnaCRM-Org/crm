type Mode = 'sign_in' | 'sign_up';
type FormState = 'submitting' | 'submit_button';
type LabelKey = `${Mode}.form.${FormState}`;

class SubmitLabelKey {
  public resolve(mode: Mode, isSubmitting: boolean): LabelKey {
    const state: FormState = isSubmitting ? 'submitting' : 'submit_button';
    return `${mode}.form.${state}` as LabelKey;
  }
}

const submitLabelKey = new SubmitLabelKey();

export default submitLabelKey;
