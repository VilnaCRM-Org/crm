import Box from '@mui/material/Box';
import qrcode from 'qrcode-generator';
import { useMemo } from 'react';
import type { JSX } from 'react';

import type { QrCodeImageProps, QrModuleMatrix } from '../../types/components/qr-code-image';

import styles from './styles';

const QUIET_ZONE = 4;
const INK = '#1A1C1E';
const PAPER = '#FFFFFF';

function encode(value: string): QrModuleMatrix {
  const code = qrcode(0, 'M');
  code.addData(value);
  code.make();
  return code;
}

function rowPath(matrix: QrModuleMatrix, row: number): string {
  const bits = Array.from({ length: matrix.getModuleCount() }, (_, col) =>
    matrix.isDark(row, col) ? '1' : '0'
  ).join('');
  return Array.from(bits.matchAll(/1+/g), ({ index, 0: run }) => {
    return `M${index + QUIET_ZONE} ${row + QUIET_ZONE}h${run.length}v1h-${run.length}z`;
  }).join('');
}

function pathOf(matrix: QrModuleMatrix): string {
  return Array.from({ length: matrix.getModuleCount() }, (_, row) => rowPath(matrix, row)).join('');
}

export default function QrCodeImage({ value, label }: QrCodeImageProps): JSX.Element {
  const matrix = useMemo(() => encode(value), [value]);
  const side = matrix.getModuleCount() + 2 * QUIET_ZONE;
  const path = useMemo(() => pathOf(matrix), [matrix]);

  return (
    <Box
      component="svg"
      role="img"
      aria-label={label}
      viewBox={`0 0 ${side} ${side}`}
      shapeRendering="crispEdges"
      sx={styles.image}
    >
      <rect width={side} height={side} fill={PAPER} />
      <path d={path} fill={INK} />
    </Box>
  );
}
