import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';

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
    <Box component="section" role="region" aria-label="Loading authentication form" sx={authFormSectionStyles.formSection}>
      <Box sx={authFormSectionStyles.formWrapper}>
        <Skeleton
          variant="text"
          height={44}
          width="70%"
          sx={styles.titleSkeleton}
          data-testid="auth-skeleton-title"
        />
        <Skeleton
          variant="text"
          height={28}
          width="90%"
          sx={styles.subtitleSkeleton}
          data-testid="auth-skeleton-subtitle"
        />

        <Box sx={styles.fieldContainer}>
          <Skeleton
            variant="text"
            height={18}
            width="40%"
            sx={styles.fieldLabel}
            data-testid="auth-skeleton-field-label"
          />
          <Skeleton
            variant="rectangular"
            sx={styles.inputSkeleton}
            data-testid="auth-skeleton-input"
          />
        </Box>

        <Box sx={styles.fieldContainer}>
          <Skeleton
            variant="text"
            height={18}
            width="40%"
            sx={styles.fieldLabel}
            data-testid="auth-skeleton-field-label"
          />
          <Skeleton
            variant="rectangular"
            sx={styles.inputSkeleton}
            data-testid="auth-skeleton-input"
          />
        </Box>

        <Box sx={styles.lastFieldContainer}>
          <Skeleton
            variant="text"
            height={18}
            width="40%"
            sx={styles.fieldLabel}
            data-testid="auth-skeleton-field-label"
          />
          <Skeleton
            variant="rectangular"
            sx={styles.inputSkeleton}
            data-testid="auth-skeleton-input"
          />
        </Box>

        <Skeleton
          variant="rectangular"
          sx={styles.buttonSkeleton}
          data-testid="auth-skeleton-submit"
        />

        <Divider role="presentation" sx={styles.divider}>
          <Skeleton
            variant="text"
            sx={styles.dividerText}
            data-testid="auth-skeleton-divider"
          />
        </Divider>

        <Box sx={styles.socialContainer}>
          {SOCIAL_BUTTONS.map((button) => (
            <Skeleton
              key={button.id}
              variant="rectangular"
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
