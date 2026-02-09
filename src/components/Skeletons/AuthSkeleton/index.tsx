import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

import UISkeletonBlock from '@/components/Skeletons/UISkeletonBlock';
import UISkeletonButton from '@/components/Skeletons/UISkeletonButton';
import UISkeletonInput from '@/components/Skeletons/UISkeletonInput';
import UISkeletonText from '@/components/Skeletons/UISkeletonText';
import authFormSectionStyles from '@/modules/User/features/Auth/components/FormSection/styles';

import styles from './styles';

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
      role="region"
      aria-label="Loading authentication form"
      sx={authFormSectionStyles.formSection}
    >
      <Box sx={authFormSectionStyles.formWrapper}>
        <UISkeletonText
          size="l"
          width="70%"
          sx={styles.titleSkeleton}
          data-testid="auth-skeleton-title"
        />
        <UISkeletonText
          size="l"
          width="90%"
          sx={styles.subtitleSkeleton}
          data-testid="auth-skeleton-subtitle"
        />

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
            width={180}
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

      <Box sx={styles.spacer} />
    </Box>
  );
}
