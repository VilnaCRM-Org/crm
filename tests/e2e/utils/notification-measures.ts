import type { Locator } from '@playwright/test';

export interface RgbaColour {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export interface NoticeEdgeReading {
  readonly edge: string;
  readonly painted: string;
  readonly backdrop: readonly string[];
}

const WHITE: RgbaColour = { r: 255, g: 255, b: 255, a: 1 };

const COLOUR_PATTERN = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)/;

const alphaOf = (raw: string | undefined): number => {
  const value = raw ?? '1';
  return value.endsWith('%') ? Number.parseFloat(value) / 100 : Number.parseFloat(value);
};

export function firstColourIn(text: string): RgbaColour {
  const match = COLOUR_PATTERN.exec(text);
  if (match === null) throw new Error(`No rgb() colour in "${text}"`);
  return {
    r: Number.parseFloat(match[1] ?? '0'),
    g: Number.parseFloat(match[2] ?? '0'),
    b: Number.parseFloat(match[3] ?? '0'),
    a: alphaOf(match[4]),
  };
}

function compositeOver(top: RgbaColour, bottom: RgbaColour): RgbaColour {
  const mix = (front: number, back: number): number => front * top.a + back * (1 - top.a);
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

function backdropColour(chain: readonly string[]): RgbaColour {
  return [...chain]
    .reverse()
    .map((colour) => firstColourIn(colour))
    .reduce((below, layer) => compositeOver(layer, below), WHITE);
}

const channel = (value: number): number => {
  const unit = value / 255;
  return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
};

function relativeLuminance(colour: RgbaColour): number {
  return 0.2126 * channel(colour.r) + 0.7152 * channel(colour.g) + 0.0722 * channel(colour.b);
}

function contrastRatio(front: RgbaColour, back: RgbaColour): number {
  const lighter = Math.max(relativeLuminance(front), relativeLuminance(back));
  const darker = Math.min(relativeLuminance(front), relativeLuminance(back));
  return (lighter + 0.05) / (darker + 0.05);
}

export function edgeRatio(edge: string, backdrop: readonly string[]): number {
  const back = backdropColour(backdrop);
  return contrastRatio(compositeOver(firstColourIn(edge), back), back);
}

export const hexOf = (colour: RgbaColour): string =>
  `#${[colour.r, colour.g, colour.b]
    .map((part) => Math.round(part).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;

export const readNoticeEdge = (card: Locator): Promise<NoticeEdgeReading> =>
  card.evaluate((element): NoticeEdgeReading => {
    const style = getComputedStyle(element);
    const value = style.getPropertyValue('--bell-notice-edge').trim();
    if (value === '') throw new Error('--bell-notice-edge has no value on the notice card');
    const probe = document.createElement('span');
    probe.style.color = value;
    document.body.append(probe);
    const edge = getComputedStyle(probe).color;
    probe.remove();
    const { filter } = getComputedStyle(element.parentElement ?? element);
    const backdrop: string[] = [];
    let layer: Element | null = document.querySelector('main');
    while (layer !== null) {
      const colour = getComputedStyle(layer).backgroundColor;
      if (!/^rgba\(.*,\s*0\)$/.test(colour) && colour !== 'transparent') backdrop.push(colour);
      if (/^rgb\(/.test(colour)) break;
      layer = layer.parentElement;
    }
    return { edge, painted: filter === 'none' ? style.borderTopColor : filter, backdrop };
  });
