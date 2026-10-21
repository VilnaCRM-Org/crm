import type { TFunction } from 'i18next';
import type { ValidateResult } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { PasswordRuleViewSet } from '@/components/types/ui-password-policy-rules';
import emailValidator from '@/modules/user/lib/validations/email';
import fullNameValidator from '@/modules/user/lib/validations/name';
import passwordValidator from '@/modules/user/lib/validations/password';
import type { UserEntity } from '@/modules/user/types/user/user-entity';

import type { ProfileFieldRules, ProfileFormRules } from '../types/hooks/use-profile-form-rules';
import type { ProfileFormValues } from '../types/user-profile/profile-form-values';
import type ProfileChangeDetector from '../utils/profile-change-detector';

function nameRule(
  user: UserEntity,
  changes: ProfileChangeDetector,
  t: TFunction
): ProfileFieldRules {
  const validate = fullNameValidator.create<ProfileFormValues>(t);
  return {
    validate: (value, values) => !changes.nameChanged(user, value) || validate(value, values),
  };
}

function emailRule(
  user: UserEntity,
  changes: ProfileChangeDetector,
  t: TFunction
): ProfileFieldRules {
  const validate = emailValidator.create<ProfileFormValues>(t);
  return {
    validate: (value, values) => !changes.emailChanged(user, value) || validate(value, values),
  };
}

function currentPasswordRule(
  user: UserEntity,
  changes: ProfileChangeDetector,
  t: TFunction
): ProfileFieldRules {
  const required = t('sign_up.form.password_input.required');
  return {
    validate: (value, values) => value !== '' || changes.detect(user, values) === null || required,
    deps: ['newPassword'],
  };
}

function newPasswordRule(changes: ProfileChangeDetector, t: TFunction): ProfileFieldRules {
  const validate = passwordValidator.create<ProfileFormValues>(t);
  const sameAsCurrent = t('settings.errors.new_password_same');
  return {
    validate: (value, values): ValidateResult | Promise<ValidateResult> => {
      if (!changes.passwordChanged(value)) return true;
      const policy = validate(value, values);
      return policy !== true ? policy : value !== values.currentPassword || sameAsCurrent;
    },
  };
}

export default function useProfileFormRules(
  user: UserEntity,
  changes: ProfileChangeDetector
): ProfileFormRules {
  const { t } = useTranslation();

  return {
    fullName: nameRule(user, changes, t),
    email: emailRule(user, changes, t),
    currentPassword: currentPasswordRule(user, changes, t),
    newPassword: newPasswordRule(changes, t),
    evaluate: (value: string): PasswordRuleViewSet => passwordValidator.evaluate(value),
  };
}
