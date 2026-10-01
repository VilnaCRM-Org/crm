import Box from '@mui/material/Box';
import type { JSX } from 'react';

import type { ErrorPageProps } from '@/components/types/error-page';

import digitStyles, { ERROR_PAGE_DIGIT_SHADOW_VAR } from './digit-styles';
import ERROR_PAGE_VARIANTS, { ERROR_PAGE_DIGITS_ID } from './error-page-variants';

const styles = digitStyles.build();

export default function ErrorPageDigits({ variant }: Pick<ErrorPageProps, 'variant'>): JSX.Element {
  const { glyphs, digitColor, digitShadowColor } = ERROR_PAGE_VARIANTS[variant];
  const [first, second, third] = glyphs;

  return (
    <Box
      id={ERROR_PAGE_DIGITS_ID}
      aria-hidden="true"
      sx={[
        styles.digits,
        styles.glyphs,
        { color: digitColor, [ERROR_PAGE_DIGIT_SHADOW_VAR]: digitShadowColor },
      ]}
    >
      <span>{first}</span>
      <span>{second}</span>
      <span>{third}</span>
    </Box>
  );
}
