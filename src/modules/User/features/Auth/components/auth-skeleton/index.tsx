
import UISkeletonBlock from '@/components/skeletons/ui-skeleton-block';
import UISkeletonButton from '@/components/skeletons/ui-skeleton-button';
import UISkeletonInput from '@/components/skeletons/ui-skeleton-input';
import UISkeletonText from '@/components/skeletons/ui-skeleton-text';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { useTranslation } from 'react-i18next';

import styles from '@/modules/User/features/Auth/components/auth-skeleton/styles';
import authFormSectionStyles from '@/modules/User/features/Auth/components/form-section/styles';

const SOCIAL_BUTTONS = [
  { id: 'google' },
  { id: 'facebook' },
  { id: 'apple' },
  { id: 'linkedin' },
] as const;

export type AuthSkeletonProps = {
  disableAnimation?: boolean;
};

export default function AuthSkeleton({
  disableAnimation = false,
}: AuthSkeletonProps): JSX.Element {
  const { t } = useTranslation();
  const staticSkeletonSx = disableAnimation
    ? {
        animation: 'none',
        backgroundSize: '100% 100%',
      }
    : undefined;

  const withStaticSx = <T extends object>(baseSx: T): (T | NonNullable<typeof staticSkeletonSx>)[] =>
    staticSkeletonSx ? [baseSx, staticSkeletonSx] : [baseSx];

  return (
    <Box
      component="section"
      aria-label={t('auth.loadingForm')}
      sx={authFormSectionStyles.formSection}
    >
      <Box
        sx={withStaticSx({ ...authFormSectionStyles.formWrapper, ...styles.formWrapperPulse })}
      >
        <UISkeletonText
          id="auth-skeleton-title"
          size="l"
          sx={withStaticSx(styles.titleSkeleton)}
        />
        <Box sx={styles.subtitleWrapper}>
          <UISkeletonText
            id="auth-skeleton-subtitle"
            size="m"
            sx={withStaticSx(styles.subtitleFirstLine)}
          />
          <UISkeletonText
            id="auth-skeleton-subtitle-line2"
            size="m"
            sx={withStaticSx(styles.subtitleSecondLine)}
          />
        </Box>

        <Box sx={styles.fieldContainer}>
          <UISkeletonText
            id="auth-skeleton-field-label-1"
            size="l"
            sx={withStaticSx(styles.fieldLabel)}
          />
          <UISkeletonInput disableAnimation={disableAnimation} id="auth-skeleton-input-1" />
        </Box>

        <Box sx={styles.fieldContainer}>
          <UISkeletonText
            id="auth-skeleton-field-label-2"
            size="l"
            sx={withStaticSx(styles.fieldLabel)}
          />
          <UISkeletonInput disableAnimation={disableAnimation} id="auth-skeleton-input-2" />
        </Box>

        <Box sx={styles.lastFieldContainer}>
          <UISkeletonText
            id="auth-skeleton-field-label-3"
            size="l"
            sx={withStaticSx(styles.fieldLabel)}
          />
          <UISkeletonInput disableAnimation={disableAnimation} id="auth-skeleton-input-3" />
        </Box>

        <UISkeletonButton
          id="auth-skeleton-submit"
          sx={withStaticSx(styles.buttonSkeleton)}
        />

        <Divider id="auth-skeleton-divider" role="presentation" sx={styles.divider}>
          <UISkeletonText
            id="auth-skeleton-divider-text"
            size="l"
            sx={withStaticSx(styles.dividerText)}
          />
        </Divider>

        <Box sx={styles.socialContainer}>
          {SOCIAL_BUTTONS.map((button) => (
            <UISkeletonBlock
              id={`auth-skeleton-social-${button.id}`}
              key={button.id}
              sx={withStaticSx(styles.socialButton)}
            />
          ))}
        </Box>
      </Box>

      <UISkeletonText
        id="auth-skeleton-switcher"
        size="l"
        sx={withStaticSx(styles.switcherSkeleton)}
      />
    </Box>
  );
}
