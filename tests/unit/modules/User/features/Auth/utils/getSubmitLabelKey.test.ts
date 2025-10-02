import getSubmitLabelKey from '@/modules/User/features/Auth/utils/getSubmitLabelKey';

describe('getSubmitLabelKey', () => {
  describe('sign_in mode', () => {
    it('should return submit button key when not submitting', () => {
      expect(getSubmitLabelKey('sign_in', false)).toBe('sign_in.form.submit_button');
    });

    it('should return submitting key when submitting', () => {
      expect(getSubmitLabelKey('sign_in', true)).toBe('sign_in.form.submitting');
    });
  });

  describe('sign_up mode', () => {
    it('should return submit button key when not submitting', () => {
      expect(getSubmitLabelKey('sign_up', false)).toBe('sign_up.form.submit_button');
    });

    it('should return submitting key when submitting', () => {
      expect(getSubmitLabelKey('sign_up', true)).toBe('sign_up.form.submitting');
    });
  });

  describe('isSubmitting behavior', () => {
    it('should return different keys based on isSubmitting state', () => {
      const keyWhenNotSubmitting = getSubmitLabelKey('sign_in', false);
      const keyWhenSubmitting = getSubmitLabelKey('sign_in', true);

      expect(keyWhenNotSubmitting).not.toBe(keyWhenSubmitting);
      expect(keyWhenNotSubmitting).toContain('submit_button');
      expect(keyWhenSubmitting).toContain('submitting');
    });

    it('should handle falsy isSubmitting values', () => {
      expect(getSubmitLabelKey('sign_in', false)).toBe('sign_in.form.submit_button');
      expect(getSubmitLabelKey('sign_up', false)).toBe('sign_up.form.submit_button');
    });

    it('should handle truthy isSubmitting values', () => {
      expect(getSubmitLabelKey('sign_in', true)).toBe('sign_in.form.submitting');
      expect(getSubmitLabelKey('sign_up', true)).toBe('sign_up.form.submitting');
    });
  });

  describe('return type validation', () => {
    it('should return string in correct format for sign_in', () => {
      const notSubmitting = getSubmitLabelKey('sign_in', false);
      const submitting = getSubmitLabelKey('sign_in', true);

      expect(typeof notSubmitting).toBe('string');
      expect(typeof submitting).toBe('string');
      expect(notSubmitting).toMatch(/^sign_in\.form\.(submit_button|submitting)$/);
      expect(submitting).toMatch(/^sign_in\.form\.(submit_button|submitting)$/);
    });

    it('should return string in correct format for sign_up', () => {
      const notSubmitting = getSubmitLabelKey('sign_up', false);
      const submitting = getSubmitLabelKey('sign_up', true);

      expect(typeof notSubmitting).toBe('string');
      expect(typeof submitting).toBe('string');
      expect(notSubmitting).toMatch(/^sign_up\.form\.(submit_button|submitting)$/);
      expect(submitting).toMatch(/^sign_up\.form\.(submit_button|submitting)$/);
    });
  });

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

  describe('consistency', () => {
    it('should return same result for same inputs', () => {
      const result1 = getSubmitLabelKey('sign_in', false);
      const result2 = getSubmitLabelKey('sign_in', false);
      expect(result1).toBe(result2);
    });

    it('should return same result for same inputs when submitting', () => {
      const result1 = getSubmitLabelKey('sign_up', true);
      const result2 = getSubmitLabelKey('sign_up', true);
      expect(result1).toBe(result2);
    });

    it('should be deterministic', () => {
      const results = Array.from({ length: 10 }, () => getSubmitLabelKey('sign_in', false));
      const allSame = results.every((result) => result === results[0]);
      expect(allSame).toBe(true);
    });
  });

  describe('key pattern structure', () => {
    it('should follow the pattern: {mode}.form.{state}', () => {
      expect(getSubmitLabelKey('sign_in', false)).toBe('sign_in.form.submit_button');
      expect(getSubmitLabelKey('sign_in', true)).toBe('sign_in.form.submitting');
      expect(getSubmitLabelKey('sign_up', false)).toBe('sign_up.form.submit_button');
      expect(getSubmitLabelKey('sign_up', true)).toBe('sign_up.form.submitting');
    });

    it('should use correct state names', () => {
      const notSubmitting = getSubmitLabelKey('sign_in', false);
      const submitting = getSubmitLabelKey('sign_in', true);

      expect(notSubmitting).toContain('submit_button');
      expect(submitting).toContain('submitting');
    });

    it('should include mode in the key', () => {
      const signInKey = getSubmitLabelKey('sign_in', false);
      const signUpKey = getSubmitLabelKey('sign_up', false);

      expect(signInKey).toContain('sign_in');
      expect(signUpKey).toContain('sign_up');
    });
  });
});
