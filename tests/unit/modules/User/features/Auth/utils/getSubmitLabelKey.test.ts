import getSubmitLabelKey from '@/modules/User/features/Auth/utils/getSubmitLabelKey';

describe('getSubmitLabelKey', () => {
  describe('all combinations', () => {
    it.each([
      ['sign_in', false, 'sign_in.form.submit_button'],
      ['sign_in', true, 'sign_in.form.submitting'],
      ['sign_up', false, 'sign_up.form.submit_button'],
      ['sign_up', true, 'sign_up.form.submitting'],
    ] as const)(
      'should return %s for mode %s and isSubmitting %s',
      (mode, isSubmitting, expected) => {
        expect(getSubmitLabelKey(mode, isSubmitting)).toBe(expected);
      }
    );
  });

  describe('isSubmitting behavior', () => {
    it('should return different keys based on isSubmitting state', () => {
      const keyWhenNotSubmitting = getSubmitLabelKey('sign_in', false);
      const keyWhenSubmitting = getSubmitLabelKey('sign_in', true);

      expect(keyWhenNotSubmitting).not.toBe(keyWhenSubmitting);
      expect(keyWhenNotSubmitting).toContain('submit_button');
      expect(keyWhenSubmitting).toContain('submitting');
    });
  });
});
