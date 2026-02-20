import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

import styles from '@/components/Skeletons/AuthSkeleton/styles';
import UISkeletonBlock from '@/components/Skeletons/UISkeletonBlock';
import UISkeletonButton from '@/components/Skeletons/UISkeletonButton';
import UISkeletonInput from '@/components/Skeletons/UISkeletonInput';
import UISkeletonText from '@/components/Skeletons/UISkeletonText';
import authFormSectionStyles from '@/modules/User/features/Auth/components/FormSection/styles';

const SOCIAL_BUTTONS = [
  { id: 'google' },
  { id: 'facebook' },
  { id: 'apple' },
  { id: 'linkedin' },
] as const;

export default function AuthSkeleton(): JSX.Element {
  return (
    <Box
      component="section"
      aria-label="Loading authentication form"
      sx={authFormSectionStyles.formSection}
    >
      <Box sx={[authFormSectionStyles.formWrapper, styles.formWrapperPulse]}>
        <UISkeletonText
          size="l"
          width="7.5rem"
          sx={styles.titleSkeleton}
          data-testid="auth-skeleton-title"
        />
        <Box sx={styles.subtitleWrapper}>
          <UISkeletonText
            size="m"
            width="17.25rem"
            sx={styles.subtitleFirstLine}
            data-testid="auth-skeleton-subtitle"
          />
          <UISkeletonText
            size="m"
            width="8rem"
            sx={styles.subtitleSecondLine}
            data-testid="auth-skeleton-subtitle-line2"
          />
        </Box>

        <Box sx={styles.fieldContainer}>
          <UISkeletonText
            size="l"
            width="40%"
            sx={styles.fieldLabel}
            data-testid="auth-skeleton-field-label"
          />
          <UISkeletonInput data-testid="auth-skeleton-input" />
        </Box>

        <Box sx={styles.fieldContainer}>
          <UISkeletonText
            size="l"
            width="40%"
            sx={styles.fieldLabel}
            data-testid="auth-skeleton-field-label"
          />
          <UISkeletonInput data-testid="auth-skeleton-input" />
        </Box>

        <Box sx={styles.lastFieldContainer}>
          <UISkeletonText
            size="l"
            width="40%"
            sx={styles.fieldLabel}
            data-testid="auth-skeleton-field-label"
          />
          <UISkeletonInput data-testid="auth-skeleton-input" />
        </Box>

        <UISkeletonButton
          sx={styles.buttonSkeleton}
          data-testid="auth-skeleton-submit"
        />

        <Divider role="presentation" sx={styles.divider}>
          <UISkeletonText
            size="l"
            width="1.86rem"
            sx={styles.dividerText}
            data-testid="auth-skeleton-divider"
          />
        </Divider>

        <Box sx={styles.socialContainer}>
          {SOCIAL_BUTTONS.map((button) => (
            <UISkeletonBlock
              key={button.id}
              sx={styles.socialButton}
              data-testid="auth-skeleton-social"
            />
          ))}
        </Box>
      </Box>

      <UISkeletonText
        size="l"
        width="14rem"
        sx={styles.switcherSkeleton}
        data-testid="auth-skeleton-switcher"
      />
    </Box>
  );
}
