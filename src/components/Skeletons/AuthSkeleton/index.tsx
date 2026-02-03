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
    <Box component="section" sx={authFormSectionStyles.formSection}>
      <Box sx={authFormSectionStyles.formWrapper}>
        <Skeleton variant="text" height={44} width="70%" sx={styles.titleSkeleton} />
        <Skeleton variant="text" height={28} width="90%" sx={styles.subtitleSkeleton} />

        <Box sx={styles.fieldContainer}>
          <Skeleton variant="text" height={18} width="40%" sx={styles.fieldLabel} />
          <Skeleton variant="rectangular" sx={styles.inputSkeleton} />
        </Box>

        <Box sx={styles.fieldContainer}>
          <Skeleton variant="text" height={18} width="40%" sx={styles.fieldLabel} />
          <Skeleton variant="rectangular" sx={styles.inputSkeleton} />
        </Box>

        <Box sx={styles.lastFieldContainer}>
          <Skeleton variant="text" height={18} width="40%" sx={styles.fieldLabel} />
          <Skeleton variant="rectangular" sx={styles.inputSkeleton} />
        </Box>

        <Skeleton variant="rectangular" sx={styles.buttonSkeleton} />

        <Divider role="presentation" sx={styles.divider}>
          <Skeleton variant="text" sx={styles.dividerText} />
        </Divider>

        <Box sx={styles.socialContainer}>
          {SOCIAL_BUTTONS.map((button) => (
            <Skeleton key={button.id} variant="rectangular" sx={styles.socialButton} />
          ))}
        </Box>
      </Box>

      <Box sx={styles.spacer} />
    </Box>
  );
}
