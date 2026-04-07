import notificationStyles from '@/modules/User/features/Auth/components/form-section/auth-forms/registration-notification.styles';

describe('registration-notification.styles', () => {
  it('keeps the notification overlay corners rounded to match the auth card', () => {
    expect(notificationStyles.notificationSection.borderRadius).toBe('16px');
  });
});
