import errorStyles from '@/modules/User/features/Auth/components/form-section/auth-forms/registration-notification.error-styles';
import successStyles from '@/modules/User/features/Auth/components/form-section/auth-forms/registration-notification.success-styles';

export default { ...successStyles, ...errorStyles } as const;
