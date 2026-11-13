import type { Meta, StoryObj } from '@storybook/react-webpack5';

import QrCodeImage from './index';

const OTPAUTH_URI =
  'otpauth://totp/VilnaCRM%3Airyna%40example.com' +
  '?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=VilnaCRM';

const meta: Meta<typeof QrCodeImage> = {
  title: 'Settings/QrCodeImage',
  component: QrCodeImage,
  tags: ['autodocs'],
  args: { value: OTPAUTH_URI, label: 'QR-код для налаштування автентифікатора' },
  argTypes: { value: { control: 'text' }, label: { control: 'text' } },
  parameters: {
    docs: {
      description: {
        component:
          'A client-side QR code for an otpauth URI: the value is encoded with error correction ' +
          'M, the module matrix is drawn as one svg path in #1A1C1E on a white quiet zone of ' +
          'four modules, and the svg is a role="img" named by the label. Nothing is fetched and ' +
          'no data: URI, raster or script is involved.',
      },
      story: { inline: false },
    },
  },
};

export default meta;

type Story = StoryObj<typeof QrCodeImage>;

export const Default: Story = {};

export const ShortValue: Story = { args: { value: 'otpauth://totp/VilnaCRM?secret=ABCD' } };
