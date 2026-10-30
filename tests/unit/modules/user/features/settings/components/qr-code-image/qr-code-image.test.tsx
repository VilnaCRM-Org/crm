import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import jsQR from 'jsqr';
import qrcode from 'qrcode-generator';

import QrCodeImage from '@/modules/user/features/settings/components/qr-code-image';
import { buildEmail, buildOtpauthUri, buildTotpSecret } from '@tests/builders';

const QUIET_ZONE = 4;
const SCALE = 6;

interface Raster {
  readonly data: Uint8ClampedArray;
  readonly size: number;
}

const rasterise = (path: string, side: number): Raster => {
  const size = side * SCALE;
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  const paint = (column: number, row: number): void => {
    for (let y = row * SCALE; y < (row + 1) * SCALE; y += 1) {
      for (let x = column * SCALE; x < (column + 1) * SCALE; x += 1) {
        const offset = (y * size + x) * 4;
        data.fill(0, offset, offset + 3);
      }
    }
  };
  for (const run of path.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    const [, column, row, length] = run.map(Number);
    for (let step = 0; step < (length ?? 0); step += 1) paint((column ?? 0) + step, row ?? 0);
  }
  return { data, size };
};

const darkCellsOf = (path: string): Set<string> => {
  const cells = new Set<string>();
  for (const run of path.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
    const [, column, row, length] = run.map(Number);
    for (let step = 0; step < (length ?? 0); step += 1) cells.add(`${row}:${(column ?? 0) + step}`);
  }
  return cells;
};

const attributeOf = (html: string, tag: string, name: string): string => {
  const found = new RegExp(`<${tag}\\b[^>]*\\s${name}="([^"]*)"`).exec(html);
  if (found?.[1] === undefined) throw new Error(`<${tag}> has no ${name}`);
  return found[1];
};

const countOf = (html: string, tag: string): number =>
  Array.from(html.matchAll(new RegExp(`<${tag}\\b`, 'g'))).length;

interface Rendered {
  readonly svg: HTMLElement;
  readonly html: string;
  readonly d: string;
  readonly side: number;
}

const renderImage = (
  value: string = buildOtpauthUri(),
  label: string = 'QR-код для налаштування автентифікатора'
): Rendered => {
  render(<QrCodeImage value={value} label={label} />);
  const svg = screen.getByRole('img', { name: label });
  const html = svg.outerHTML;
  return {
    svg,
    html,
    d: attributeOf(html, 'path', 'd'),
    side: Number(attributeOf(html, 'svg', 'viewBox').split(' ')[2]),
  };
};

const referenceOf = (value: string, level: 'L' | 'M' | 'Q'): ReturnType<typeof qrcode> => {
  const reference = qrcode(0, level);
  reference.addData(value);
  reference.make();
  return reference;
};

describe('QrCodeImage', () => {
  it('draws one svg image named by the label', () => {
    const { svg } = renderImage();

    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('draws one path in #1A1C1E on a white quiet zone of four modules', () => {
    const value = buildOtpauthUri(buildEmail(), buildTotpSecret());
    const side = referenceOf(value, 'M').getModuleCount() + 2 * QUIET_ZONE;

    const { svg, html } = renderImage(value);

    expect(svg).toHaveAttribute('viewBox', `0 0 ${side} ${side}`);
    expect(countOf(html, 'path')).toBe(1);
    expect(attributeOf(html, 'path', 'fill')).toBe('#1A1C1E');
    expect(attributeOf(html, 'rect', 'fill')).toBe('#FFFFFF');
    expect(attributeOf(html, 'rect', 'width')).toBe(String(side));
    expect(attributeOf(html, 'rect', 'height')).toBe(String(side));
  });

  it('encodes the value with error correction M, module for module', () => {
    const value = buildOtpauthUri();
    const reference = referenceOf(value, 'M');

    const { d } = renderImage(value);

    const expected = new Set<string>();
    for (let row = 0; row < reference.getModuleCount(); row += 1) {
      for (let col = 0; col < reference.getModuleCount(); col += 1) {
        if (reference.isDark(row, col)) expected.add(`${row + QUIET_ZONE}:${col + QUIET_ZONE}`);
      }
    }
    expect(darkCellsOf(d)).toEqual(expected);
  });

  it('does not draw with another error correction level', () => {
    const value = buildOtpauthUri();

    const { side } = renderImage(value);

    expect(side).not.toBe(referenceOf(value, 'L').getModuleCount() + 2 * QUIET_ZONE);
    expect(side).not.toBe(referenceOf(value, 'Q').getModuleCount() + 2 * QUIET_ZONE);
  });

  it('round-trips: a decoder reads the rasterised path back to the exact URI', () => {
    const value = buildOtpauthUri(buildEmail(), buildTotpSecret());

    const { d, side } = renderImage(value);

    const { data, size } = rasterise(d, side);
    expect(jsQR(data, size, size)?.data).toBe(value);
  });

  it('merges horizontal runs of dark modules into one subpath each', () => {
    const { d } = renderImage();

    expect(d).toMatch(/^M\d+ \d+h\d+v1h-\d+z/);
    expect(d.replace(/M\d+ \d+h(\d+)v1h-\1z/g, '')).toBe('');
    expect(Array.from(d.matchAll(/h(\d+)v1/g)).some((run) => Number(run[1]) > 1)).toBe(true);
  });

  it('redraws when the value changes', () => {
    const first = buildOtpauthUri();
    const second = buildOtpauthUri(buildEmail(), buildTotpSecret());
    const { rerender } = render(<QrCodeImage value={first} label="QR" />);
    const before = attributeOf(screen.getByRole('img', { name: 'QR' }).outerHTML, 'path', 'd');

    rerender(<QrCodeImage value={second} label="QR" />);

    expect(attributeOf(screen.getByRole('img', { name: 'QR' }).outerHTML, 'path', 'd')).not.toBe(
      before
    );
  });

  it('renders no data URI, raster, foreign or script content', () => {
    const { svg, html } = renderImage();

    expect(html).not.toMatch(/data:|<image|foreignObject|<script|href=/i);
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('shape-rendering', 'crispEdges');
  });
});
