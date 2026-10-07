import Box from '@mui/material/Box';
import type { Decorator } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import errorPageStyles from '../src/components/error-page/styles';

const styles = errorPageStyles.build();

export function withErrorPageFrame(minHeight = 0): Decorator {
  return function ErrorPageFrameDecorator(Story): JSX.Element {
    return (
      <Box sx={[styles.landmark, { minHeight: '100vh' }]}>
        <Box sx={[styles.composition, { minHeight: `${minHeight}px` }]}>
          <Story />
        </Box>
      </Box>
    );
  };
}
