import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { type JSX, useState } from 'react';

import type { RailShape } from '@/components/types/ui-navigation-list';

import NavigationRailTooltip from './navigation-rail-tooltip';

interface RailTooltipStoryArgs {
  readonly label: string;
  readonly shape: RailShape;
}

function TooltipBesideRow({ label, shape }: RailTooltipStoryArgs): JSX.Element {
  const [row, setRow] = useState<HTMLDivElement | null>(null);

  return (
    <div style={{ width: 240, height: 80 }}>
      <div ref={setRow} style={{ width: 72, height: 54 }} />
      {row && <NavigationRailTooltip label={label} shape={shape} anchor={row} />}
    </div>
  );
}

const meta: Meta<RailTooltipStoryArgs> = {
  title: 'Shell/Navigation/NavigationRailTooltip',
  component: TooltipBesideRow,
  tags: ['autodocs'],
  args: { label: 'Інтеграції', shape: 'desktop' },
  argTypes: {
    shape: {
      control: 'select',
      options: ['desktop', 'tablet', 'tabletProducts', 'tabletCompact', 'action'],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The rail tooltip `386:26142`: a 6×20.79 caret in `#E1E7EA` and a white body with an ' +
          'inside 1 px `#E1E7EA` stroke, radius 8, padding 12/16, Inter 500 16/18 `#191B1E`, ' +
          'shadow `0 6px 17px rgba(37,42,49,.07)`. It is fixed to the viewport at its row’s ' +
          'offset and follows the row when the rail list or the page scrolls, so the scrolling ' +
          'rail never clips it. It is hidden from assistive technology: the row keeps its label ' +
          'as text.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<RailTooltipStoryArgs>;

export const Desktop: Story = {};

export const Tablet: Story = { args: { shape: 'tablet' } };
