import styles from '@/modules/user/features/auth/components/form-section/styles';

describe('form section notification wrapper sizing', () => {
  it('keeps overflow hidden for registration replacement state', () => {
    const wrapperWithNotification = styles.formWrapperWithNotification['&&'];

    expect(wrapperWithNotification.overflow).toBe('hidden');
  });
});
