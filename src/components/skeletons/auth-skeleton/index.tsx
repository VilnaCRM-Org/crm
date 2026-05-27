import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { useTranslation } from 'react-i18next';

import styles from '@/components/skeletons/auth-skeleton/styles';
import UISkeletonBlock from '@/components/skeletons/ui-skeleton-block';
import UISkeletonButton from '@/components/skeletons/ui-skeleton-button';
import UISkeletonInput from '@/components/skeletons/ui-skeleton-input';
import UISkeletonText from '@/components/skeletons/ui-skeleton-text';

const SOCIAL_BUTTONS = [
  { id: 'google' },
  { id: 'facebook' },
  { id: 'apple' },
  { id: 'linkedin' },
] as const;

const STATIC_SX = { animation: 'none', backgroundSize: '100% 100%' } as const;

export type AuthSkeletonProps = {
  disableAnimation?: boolean;
};

type Wrap = <T extends object>(baseSx: T) => (T | typeof STATIC_SX)[];

const buildWrap =
  (disableAnimation: boolean): Wrap =>
  (baseSx) =>
    disableAnimation ? [baseSx, STATIC_SX] : [baseSx];

function TitleBlock({ wrap }: { wrap: Wrap }): JSX.Element {
  return (
    <>
      <UISkeletonText id="auth-skeleton-title" size="l" sx={wrap(styles.titleSkeleton)} />
      <Box sx={styles.subtitleWrapper}>
        <UISkeletonText id="auth-skeleton-subtitle" size="m" sx={wrap(styles.subtitleFirstLine)} />
        <UISkeletonText
          id="auth-skeleton-subtitle-line2"
          size="m"
          sx={wrap(styles.subtitleSecondLine)}
        />
      </Box>
    </>
  );
}

function FieldRows({
  wrap,
  disableAnimation,
}: {
  wrap: Wrap;
  disableAnimation: boolean;
}): JSX.Element {
  return (
    <>
      {[1, 2, 3].map((id) => (
        <Box key={id} sx={id === 3 ? styles.lastFieldContainer : styles.fieldContainer}>
          <UISkeletonText
            id={`auth-skeleton-field-label-${id}`}
            size="l"
            sx={wrap(styles.fieldLabel)}
          />
          <UISkeletonInput disableAnimation={disableAnimation} id={`auth-skeleton-input-${id}`} />
        </Box>
      ))}
    </>
  );
}

function SocialBlocks({ wrap }: { wrap: Wrap }): JSX.Element {
  return (
    <Box sx={styles.socialContainer}>
      {SOCIAL_BUTTONS.map((button) => (
        <UISkeletonBlock
          id={`auth-skeleton-social-${button.id}`}
          key={button.id}
          sx={wrap(styles.socialButton)}
        />
      ))}
    </Box>
  );
}

function DividerBlock({ wrap }: { wrap: Wrap }): JSX.Element {
  return (
    <Divider id="auth-skeleton-divider" role="presentation" sx={styles.divider}>
      <UISkeletonText id="auth-skeleton-divider-text" size="l" sx={wrap(styles.dividerText)} />
    </Divider>
  );
}

function FormBody({
  wrap,
  disableAnimation,
}: {
  wrap: Wrap;
  disableAnimation: boolean;
}): JSX.Element {
  return (
    <Box sx={wrap({ ...styles.formWrapper, ...styles.formWrapperPulse })}>
      <TitleBlock wrap={wrap} />
      <FieldRows wrap={wrap} disableAnimation={disableAnimation} />
      <UISkeletonButton id="auth-skeleton-submit" sx={wrap(styles.buttonSkeleton)} />
      <DividerBlock wrap={wrap} />
      <SocialBlocks wrap={wrap} />
    </Box>
  );
}

export default function AuthSkeleton({ disableAnimation = false }: AuthSkeletonProps): JSX.Element {
  const { t } = useTranslation();
  const wrap = buildWrap(disableAnimation);

  return (
    <Box component="section" aria-label={t('auth.loadingForm')} sx={styles.formSection}>
      <FormBody wrap={wrap} disableAnimation={disableAnimation} />
      <UISkeletonText id="auth-skeleton-switcher" size="l" sx={wrap(styles.switcherSkeleton)} />
    </Box>
  );
}
