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

const STATIC_SX = { animation: 'none', backgroundSize: '100% 100%' } as const;
const FIELD_CONFIGS = [
  { id: 1, containerSx: styles.fieldContainer },
  { id: 2, containerSx: styles.fieldContainer },
  { id: 3, containerSx: styles.lastFieldContainer },
] as const;

export type AuthSkeletonProps = {
  disableAnimation?: boolean;
};

type Wrap = <T extends object>(baseSx: T) => (T | typeof STATIC_SX)[];

const buildWrap =
  (disableAnimation: boolean): Wrap =>
  (baseSx) =>
    disableAnimation ? [baseSx, STATIC_SX] : [baseSx];

function SubtitleBlock({ wrap }: { wrap: Wrap }): JSX.Element {
  return (
    <Box sx={styles.subtitleWrapper}>
      <UISkeletonText id="auth-skeleton-subtitle" size="m" sx={wrap(styles.subtitleFirstLine)} />
      <UISkeletonText
        id="auth-skeleton-subtitle-line2"
        size="m"
        sx={wrap(styles.subtitleSecondLine)}
      />
    </Box>
  );
}

function SkeletonField({
  id,
  wrap,
  disableAnimation,
  containerSx,
}: {
  id: number;
  wrap: Wrap;
  disableAnimation: boolean;
  containerSx: typeof styles.fieldContainer | typeof styles.lastFieldContainer;
}): JSX.Element {
  return (
    <Box sx={containerSx}>
      <UISkeletonText
        id={`auth-skeleton-field-label-${id}`}
        size="l"
        sx={wrap(styles.fieldLabel)}
      />
      <UISkeletonInput disableAnimation={disableAnimation} id={`auth-skeleton-input-${id}`} />
    </Box>
  );
}

function SocialButtons({ wrap }: { wrap: Wrap }): JSX.Element {
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

function SkeletonFields({
  wrap,
  disableAnimation,
}: {
  wrap: Wrap;
  disableAnimation: boolean;
}): JSX.Element {
  return (
    <>
      {FIELD_CONFIGS.map((field) => (
        <SkeletonField
          key={field.id}
          id={field.id}
          wrap={wrap}
          disableAnimation={disableAnimation}
          containerSx={field.containerSx}
        />
      ))}
    </>
  );
}

function SkeletonDivider({ wrap }: { wrap: Wrap }): JSX.Element {
  return (
    <Divider id="auth-skeleton-divider" role="presentation" sx={styles.divider}>
      <UISkeletonText id="auth-skeleton-divider-text" size="l" sx={wrap(styles.dividerText)} />
    </Divider>
  );
}

function FormSkeletonContent({
  wrap,
  disableAnimation,
}: {
  wrap: Wrap;
  disableAnimation: boolean;
}): JSX.Element {
  return (
    <>
      <UISkeletonText id="auth-skeleton-title" size="l" sx={wrap(styles.titleSkeleton)} />
      <SubtitleBlock wrap={wrap} />
      <SkeletonFields wrap={wrap} disableAnimation={disableAnimation} />
      <UISkeletonButton id="auth-skeleton-submit" sx={wrap(styles.buttonSkeleton)} />
      <SkeletonDivider wrap={wrap} />
      <SocialButtons wrap={wrap} />
    </>
  );
}

export default function AuthSkeleton({
  disableAnimation = false,
}: AuthSkeletonProps): JSX.Element {
  const { t } = useTranslation();
  const wrap = buildWrap(disableAnimation);
  return (
    <Box
      component="section"
      aria-label={t('auth.loadingForm')}
      sx={authFormSectionStyles.formSection}
    >
      <Box sx={wrap({ ...authFormSectionStyles.formWrapper, ...styles.formWrapperPulse })}>
        <FormSkeletonContent wrap={wrap} disableAnimation={disableAnimation} />
      </Box>
      <UISkeletonText id="auth-skeleton-switcher" size="l" sx={wrap(styles.switcherSkeleton)} />
    </Box>
  );
}
