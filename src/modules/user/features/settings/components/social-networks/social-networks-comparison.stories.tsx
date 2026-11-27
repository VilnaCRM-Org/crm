import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { JSX } from 'react';
import type { ViewportMap } from 'storybook/viewport';

import layoutStyles from '@/components/layouts/app-layout.styles';
import UIShellContent from '@/components/ui-shell-content';
import { customColors, paletteColors } from '@/styles/colors';
import { noop, noopAsync } from '@stories/story-callbacks';

import type { SocialTileStyle } from '../../types/components/social-tile-style';
import type { SocialLinks } from '../../types/social-link/social-links';
import SettingsGrid from '../settings-grid';

import { SocialNetworksCard } from './index';

interface ComparisonRow {
  readonly tileStyle: SocialTileStyle;
  readonly caption: string;
}

const LINKED: SocialLinks = {
  status: 'ready',
  linked: { items: ['google', 'github'] },
  busy: false,
  link: noopAsync,
  unlink: noopAsync,
  retry: noop,
};

const BUSY: SocialLinks = { ...LINKED, busy: true };

const ROWS: readonly ComparisonRow[] = [
  {
    tileStyle: 'tinted',
    caption: '1 — Tinted: the shipped tile and the default (Figma 315:11754)',
  },
  {
    tileStyle: 'badge',
    caption: '2 — Badge: status badge and danger-lane bin (UI kit 451:25845, 632:46703)',
  },
  {
    tileStyle: 'labelled',
    caption: '3 — Labelled: selected outline and outlined pill (UI kit 439:19640, 439:19257)',
  },
];

const VIEWPORTS: ViewportMap = {
  comparison375: {
    name: 'Comparison phone (375)',
    styles: { width: '375px', height: '812px' },
    type: 'mobile',
  },
  comparison768: {
    name: 'Comparison tablet (768)',
    styles: { width: '768px', height: '1024px' },
    type: 'tablet',
  },
  comparison1025: {
    name: 'Comparison desktop (1025)',
    styles: { width: '1025px', height: '768px' },
    type: 'desktop',
  },
  comparison1100: {
    name: 'Comparison desktop (1100)',
    styles: { width: '1100px', height: '800px' },
    type: 'desktop',
  },
  comparison1440: {
    name: 'Comparison desktop (1440)',
    styles: { width: '1440px', height: '900px' },
    type: 'desktop',
  },
};

const STAGE = {
  standIn: {
    boxSizing: 'border-box',
    border: `1px dashed ${paletteColors.background.subtle}`,
    borderRadius: '0.75rem',
  },
  secondColumn: { minHeight: '20rem' },
  column: { display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0 },
  heading: {
    margin: '1.5rem 0 0',
    fontFamily: 'Golos',
    fontWeight: 700,
    fontSize: '1.375rem',
    color: customColors.text.dark,
  },
  caption: {
    margin: '0.75rem 0 0',
    fontFamily: 'Golos',
    fontWeight: 600,
    fontSize: '0.9375rem',
    color: customColors.text.primary,
  },
} as const;

function StyleCards({ tileStyle, caption }: ComparisonRow): JSX.Element {
  return (
    <Box sx={STAGE.column}>
      <Box component="p" sx={STAGE.caption}>
        {caption}
      </Box>
      <SocialNetworksCard links={LINKED} tileStyle={tileStyle} />
      <Box component="p" sx={STAGE.caption}>
        Busy
      </Box>
      <SocialNetworksCard links={BUSY} tileStyle={tileStyle} />
    </Box>
  );
}

function ComparisonStage(): JSX.Element {
  return (
    <Box sx={layoutStyles.frame}>
      <Box
        aria-hidden="true"
        sx={[layoutStyles.navSlot, layoutStyles.navPlaceholder, STAGE.standIn]}
      />
      <Box component="main" sx={layoutStyles.main}>
        <UIShellContent>
          <Box component="h1" sx={STAGE.heading}>
            Linked social tile styles
          </Box>
          <SettingsGrid>
            <Box sx={STAGE.column}>
              {ROWS.map((row) => (
                <StyleCards key={row.tileStyle} tileStyle={row.tileStyle} caption={row.caption} />
              ))}
            </Box>
            <Box aria-hidden="true" sx={[STAGE.standIn, STAGE.secondColumn]} />
          </SettingsGrid>
        </UIShellContent>
      </Box>
    </Box>
  );
}

const meta: Meta<typeof ComparisonStage> = {
  title: 'Settings/SocialNetworks/Comparison',
  component: ComparisonStage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { options: VIEWPORTS },
    docs: {
      description: {
        component:
          'The three trial styles of a linked social tile, stacked in the profile column of ' +
          'the settings page at the widths the product owner compares them at: 375, 768, ' +
          '1025, 1100 and 1440 px. Google and GitHub are linked in every card, and each style ' +
          'is shown idle and busy. The dashed boxes stand in for the sidebar and the two-factor ' +
          'card, so each card gets the width the page gives it; the tile media queries follow ' +
          'the viewport and the labelled pill follows its own tile, showing "Відключити" from ' +
          'a 16rem tile content box and a 44 px bin circle below that. The settings page ' +
          'always renders `tinted`; the losing styles are removed in one change once one is ' +
          'picked.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ComparisonStage>;

export const Phone375: Story = {
  globals: { viewport: { value: 'comparison375', isRotated: false } },
};

export const Tablet768: Story = {
  globals: { viewport: { value: 'comparison768', isRotated: false } },
};

export const Desktop1025: Story = {
  globals: { viewport: { value: 'comparison1025', isRotated: false } },
};

export const Desktop1100: Story = {
  globals: { viewport: { value: 'comparison1100', isRotated: false } },
};

export const Desktop1440: Story = {
  globals: { viewport: { value: 'comparison1440', isRotated: false } },
};
