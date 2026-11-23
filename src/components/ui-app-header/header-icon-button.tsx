import Box from '@mui/material/Box';
import type { ComponentType, JSX, SVGProps } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as BellIcon } from '@/assets/icons/shell/bell-01.svg';
import { ReactComponent as TasksIcon } from '@/assets/icons/shell/dotpoints-01.svg';
import type {
  DisclosureButtonProps,
  HeaderControlKind,
  HeaderGlyphProps,
  HeaderIconButtonProps,
} from '@/components/types/ui-app-header';

import badgeCountGuard from './badge-count-guard';
import bellStyles from './bell-styles';
import HeaderBadge from './header-badge';
import HeaderHiddenText from './header-hidden-text';
import styles from './styles';

const GLYPHS: Record<HeaderControlKind, ComponentType<SVGProps<SVGSVGElement>>> = {
  notifications: BellIcon,
  tasks: TasksIcon,
};

function HeaderGlyph({ layout, kind }: HeaderGlyphProps): JSX.Element {
  return (
    <Box
      component={GLYPHS[kind]}
      aria-hidden="true"
      focusable="false"
      sx={styles.iconGlyph[layout]}
    />
  );
}

function DisclosureButton({ layout, kind, count, disclosure }: DisclosureButtonProps): JSX.Element {
  const { t } = useTranslation();
  const descriptionId = useId();
  const { expanded, controls, describedBy, onToggle, buttonRef } = disclosure;

  return (
    <>
      <Box
        component="button"
        type="button"
        ref={buttonRef}
        aria-label={t(`app_shell.${kind}.label`)}
        aria-expanded={expanded}
        aria-controls={controls}
        aria-describedby={describedBy === undefined ? undefined : descriptionId}
        sx={bellStyles.enabled[layout]}
        onClick={onToggle}
      >
        <HeaderGlyph layout={layout} kind={kind} />
      </Box>
      {layout !== 'mobile' && <HeaderBadge count={count} tone="alert" />}
      {describedBy !== undefined && (
        <HeaderHiddenText id={descriptionId}>{describedBy}</HeaderHiddenText>
      )}
    </>
  );
}

function DisabledButton({ layout, kind, count }: HeaderIconButtonProps): JSX.Element {
  const { t } = useTranslation();
  const statusId = useId();
  const countId = useId();
  const showsCount = layout !== 'mobile' && badgeCountGuard.shows(count);

  return (
    <>
      <Box sx={bellStyles.slot[layout]}>
        <Box
          component="button"
          type="button"
          disabled
          aria-label={t(`app_shell.${kind}.label`)}
          aria-describedby={showsCount ? `${statusId} ${countId}` : statusId}
          sx={styles.iconButton[layout]}
        >
          <HeaderGlyph layout={layout} kind={kind} />
        </Box>
        {layout !== 'mobile' && <HeaderBadge count={count} />}
      </Box>
      <HeaderHiddenText id={statusId}>{t('app_shell.unavailable')}</HeaderHiddenText>
      {showsCount && (
        <HeaderHiddenText id={countId}>
          {t(`app_shell.${kind}.count`, { count: Number(count) })}
        </HeaderHiddenText>
      )}
    </>
  );
}

export default function HeaderIconButton({
  layout,
  kind,
  count,
  disclosure,
}: HeaderIconButtonProps): JSX.Element {
  return disclosure === undefined ? (
    <DisabledButton layout={layout} kind={kind} count={count} />
  ) : (
    <DisclosureButton layout={layout} kind={kind} count={count} disclosure={disclosure} />
  );
}
