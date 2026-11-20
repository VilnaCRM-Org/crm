import Box from '@mui/material/Box';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, type ReactNode, type RefObject, useRef } from 'react';

import type { UIBellNoticeProps } from '@/components/types/ui-bell-notice';
import UIBellNotice from '@/components/ui-bell-notice';
import { noop } from '@stories/story-callbacks';

type StageProps = Pick<UIBellNoticeProps, 'views'>;

interface StageHeaderProps {
  readonly bell: RefObject<HTMLButtonElement | null>;
  readonly children: ReactNode;
}

interface StageMainProps {
  readonly save: RefObject<HTMLButtonElement | null>;
  readonly heading: RefObject<HTMLHeadingElement | null>;
}

const STAGE = {
  page: { minHeight: '20rem', backgroundColor: '#FBFBFB' },
  header: { position: 'sticky', top: 0, height: '64px', display: 'flex', alignItems: 'center' },
  wrapper: { position: 'relative', marginLeft: 'auto', marginRight: '3rem' },
  bell: {
    position: 'relative',
    zIndex: 1,
    width: '48px',
    height: '48px',
    border: 0,
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
  },
  main: { padding: '1rem' },
  heading: { font: 'inherit' },
} as const;

function StageHeader({ bell, children }: StageHeaderProps): JSX.Element {
  return (
    <Box component="header" sx={STAGE.header}>
      <Box sx={STAGE.wrapper}>
        <Box component="button" type="button" ref={bell} aria-label="Сповіщення" sx={STAGE.bell} />
        {children}
      </Box>
    </Box>
  );
}

function StageMain({ save, heading }: StageMainProps): JSX.Element {
  return (
    <Box component="main" sx={STAGE.main}>
      <Box component="h1" tabIndex={-1} ref={heading} sx={STAGE.heading}>
        Налаштування
      </Box>
      <Box component="button" type="button" ref={save}>
        Зберегти
      </Box>
    </Box>
  );
}

function NoticeStage({ views }: StageProps): JSX.Element {
  const bell = useRef<HTMLButtonElement>(null);
  const save = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  return (
    <Box sx={STAGE.page}>
      <StageHeader bell={bell}>
        <UIBellNotice
          views={views}
          bellRef={bell}
          returnFocusRef={save}
          fallbackFocusRef={heading}
          onDismiss={noop}
        />
      </StageHeader>
      <StageMain save={save} heading={heading} />
    </Box>
  );
}

const meta: Meta<typeof NoticeStage> = {
  title: 'Components/Feedback/UIBellNotice',
  component: NoticeStage,
  tags: ['autodocs'],
  args: {
    views: {
      items: [
        {
          id: '1',
          kind: 'success',
          message: 'Зміни збережено',
          time: '10 листопада, 09:15',
        },
      ],
    },
  },
  globals: { viewport: { value: 'xl', isRotated: false } },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The bell notice of variant C. From 1440 px it is the merged shape: a 48 by 117 pill ' +
          'fused with a 256 wide card at 23, 55, outlined in the tone of the most severe row ' +
          'with four 1 px drop shadows. Below 1440 px it is a caret card, `min(313px, 100vw - ' +
          '32px)` wide, whose 26 by 6 caret points at the bell centre. Rows show a time and a ' +
          'close button, newest last, at most three. It carries no role, `aria-live` or ' +
          '`aria-atomic`, so the time is never announced, and it stays until the person closes ' +
          'it. Closing moves focus to the next close button, then the previous, then the Save ' +
          'target, then the h1. While shown it sets `--bell-centre-x`, `--bell-bottom` and ' +
          '`--app-top-overhang` on the root element.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NoticeStage>;

const THREE = {
  items: [
    { id: '1', kind: 'success', message: "Ім'я збережено", time: '10 листопада, 09:15' },
    { id: '2', kind: 'success', message: 'Лист надіслано', time: '10 листопада, 09:16' },
    { id: '3', kind: 'success', message: 'Пароль змінено', time: '10 листопада, 09:17' },
  ],
} as const;

export const DesktopOne: Story = {};

export const DesktopThree: Story = { args: { views: THREE } };

export const CaretTablet: Story = {
  args: { views: THREE },
  globals: { viewport: { value: 'lg', isRotated: false } },
};

export const CaretMobile: Story = {
  args: { views: THREE },
  globals: { viewport: { value: 'xs', isRotated: false } },
};

export const Error: Story = {
  args: {
    views: {
      items: [
        { id: '1', kind: 'success', message: "Ім'я збережено", time: '10 листопада, 09:15' },
        {
          id: '2',
          kind: 'error',
          message: 'Не вдалося надіслати лист',
          time: '10 листопада, 09:16',
          action: { label: 'Повторити', onActivate: noop },
        },
      ],
    },
  },
};

export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A simulation: Storybook cannot switch `prefers-reduced-motion`, so this story removes ' +
          'every animation in its frame. With the real preference the notice appears at once.',
      },
    },
  },
  decorators: [
    (Story): JSX.Element => (
      <Box sx={{ '& *': { animation: 'none !important' } }}>
        <Story />
      </Box>
    ),
  ],
};
