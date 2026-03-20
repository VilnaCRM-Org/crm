import UISkeletonBlock from '@/components/skeletons/ui-skeleton-block';
import UISkeletonButton from '@/components/skeletons/ui-skeleton-button';
import UISkeletonInput from '@/components/skeletons/ui-skeleton-input';
import UISkeletonText from '@/components/skeletons/ui-skeleton-text';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

import styles from '@/modules/user/features/auth/components/auth-skeleton/styles';
import authFormSectionStyles from '@/modules/user/features/auth/components/form-section/styles';

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
          id="auth-skeleton-title"
          size="l"
          sx={styles.titleSkeleton}
        />
        <Box sx={styles.subtitleWrapper}>
          <UISkeletonText
            id="auth-skeleton-subtitle"
            size="m"
            sx={styles.subtitleFirstLine}
          />
          <UISkeletonText
            id="auth-skeleton-subtitle-line2"
            size="m"
            sx={styles.subtitleSecondLine}
          />
        </Box>

        <Box sx={styles.fieldContainer}>
          <UISkeletonText
            id="auth-skeleton-field-label-1"
            size="l"
            sx={styles.fieldLabel}
          />
          <UISkeletonInput id="auth-skeleton-input-1" />
        </Box>

        <Box sx={styles.fieldContainer}>
          <UISkeletonText
            id="auth-skeleton-field-label-2"
            size="l"
            sx={styles.fieldLabel}
          />
          <UISkeletonInput id="auth-skeleton-input-2" />
        </Box>

        <Box sx={styles.lastFieldContainer}>
          <UISkeletonText
            id="auth-skeleton-field-label-3"
            size="l"
            sx={styles.fieldLabel}
          />
          <UISkeletonInput id="auth-skeleton-input-3" />
        </Box>

        <UISkeletonButton
          id="auth-skeleton-submit"
          sx={styles.buttonSkeleton}
        />

        <Divider
          id="auth-skeleton-divider"
          role="presentation"
          sx={styles.divider}
        >
          <UISkeletonText size="l" sx={styles.dividerText} />
        </Divider>

        <Box sx={styles.socialContainer}>
          {SOCIAL_BUTTONS.map((button) => (
            <UISkeletonBlock
              id={`auth-skeleton-social-${button.id}`}
              key={button.id}
              sx={styles.socialButton}
            />
          ))}
        </Box>
      </Box>

      <UISkeletonText
        id="auth-skeleton-switcher"
        size="l"
        sx={styles.switcherSkeleton}
      />
    </Box>
  );
}
