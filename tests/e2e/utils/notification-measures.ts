import type { Locator, Page } from '@playwright/test';

export interface RgbaColour {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export type BackdropOrigin = 'main' | 'parent';

export interface SurfaceReading {
  readonly border: string;
  readonly shadow: string;
  readonly tone: string;
  readonly tint: string;
  readonly backdrop: readonly string[];
}

export interface CentrePoint {
  readonly x: number;
  readonly y: number;
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

export function compositeOver(top: RgbaColour, bottom: RgbaColour): RgbaColour {
  const mix = (front: number, back: number): number => front * top.a + back * (1 - top.a);
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

export function backdropColour(chain: readonly string[]): RgbaColour {
  return [...chain]
    .reverse()
    .map((colour) => firstColourIn(colour))
    .reduce((below, layer) => compositeOver(layer, below), WHITE);
}

const channel = (value: number): number => {
  const unit = value / 255;
  return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
};

export function relativeLuminance(colour: RgbaColour): number {
  return 0.2126 * channel(colour.r) + 0.7152 * channel(colour.g) + 0.0722 * channel(colour.b);
}

export function contrastRatio(front: RgbaColour, back: RgbaColour): number {
  const lighter = Math.max(relativeLuminance(front), relativeLuminance(back));
  const darker = Math.min(relativeLuminance(front), relativeLuminance(back));
  return (lighter + 0.05) / (darker + 0.05);
}

export function edgeRatio(edge: string, backdrop: readonly string[]): number {
  const back = backdropColour(backdrop);
  return contrastRatio(compositeOver(firstColourIn(edge), back), back);
}

export const rounded = (value: number): number => Math.round(value * 100) / 100;

export const hexOf = (colour: RgbaColour): string =>
  `#${[colour.r, colour.g, colour.b]
    .map((part) => Math.round(part).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;

export const centreDistance = (first: CentrePoint, second: CentrePoint): number =>
  Math.hypot(first.x - second.x, first.y - second.y);

export const readSurface = (outcome: Locator, origin: BackdropOrigin): Promise<SurfaceReading> =>
  outcome.evaluate((element, from): SurfaceReading => {
    const style = getComputedStyle(element);
    const probe = document.createElement('span');
    probe.style.color = style.getPropertyValue('--bell-notice-tone').trim();
    document.body.append(probe);
    const tone = getComputedStyle(probe).color;
    probe.remove();
    const backdrop: string[] = [];
    let layer: Element | null =
      from === 'main' ? document.querySelector('main') : element.parentElement;
    while (layer !== null) {
      const colour = getComputedStyle(layer).backgroundColor;
      if (!/^rgba\(.*,\s*0\)$/.test(colour) && colour !== 'transparent') backdrop.push(colour);
      if (/^rgb\(/.test(colour)) break;
      layer = layer.parentElement;
    }
    return {
      border: style.borderTopColor,
      shadow: style.boxShadow,
      tone,
      tint: style.backgroundColor,
      backdrop,
    };
  }, origin);

const CONTROL_SELECTOR = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="button"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export const coveredControlsOf = (containers: Locator): Promise<readonly string[]> =>
  containers.evaluateAll((covers, selector): string[] => {
    const areas = covers.map((cover) => cover.getBoundingClientRect());
    const overlaps = (box: DOMRect, area: DOMRect): boolean =>
      Math.min(box.right, area.right) - Math.max(box.left, area.left) > 0.5 &&
      Math.min(box.bottom, area.bottom) - Math.max(box.top, area.top) > 0.5;
    const nameOf = (control: Element): string => {
      const labelled = 'labels' in control ? (control as HTMLInputElement).labels?.[0] : undefined;
      const name =
        control.getAttribute('aria-label') ??
        labelled?.textContent?.trim() ??
        control.textContent?.trim() ??
        '';
      return `${control.tagName.toLowerCase()} "${name}"`;
    };
    const controls = [...(document.querySelector('main')?.querySelectorAll(selector) ?? [])];
    return controls
      .filter((control) => !covers.some((cover) => cover.contains(control)))
      .filter((control) => getComputedStyle(control).visibility !== 'hidden')
      .filter((control) => {
        const box = control.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && areas.some((area) => overlaps(box, area));
      })
      .map((control) => nameOf(control));
  }, CONTROL_SELECTOR);

export const focusedCoversOf = (containers: Locator): Promise<readonly string[]> =>
  containers.evaluateAll((covers): string[] => {
    const focused = document.activeElement;
    if (focused === null || focused === document.body) return [];
    const header = document.querySelector('header');
    const candidates = header === null ? covers : [...covers, header];
    const box = focused.getBoundingClientRect();
    return candidates
      .filter((cover) => !cover.contains(focused))
      .filter((cover) => {
        const area = cover.getBoundingClientRect();
        return (
          Math.min(box.right, area.right) - Math.max(box.left, area.left) > 0.5 &&
          Math.min(box.bottom, area.bottom) - Math.max(box.top, area.top) > 0.5
        );
      })
      .map((cover) => (cover === header ? 'header' : cover.tagName.toLowerCase()));
  });

export const focusedNameOf = (page: Page): Promise<string> =>
  page.evaluate((): string => {
    const focused = document.activeElement;
    const name = focused?.getAttribute('aria-label') ?? focused?.textContent?.trim() ?? '';
    return `${focused?.tagName.toLowerCase() ?? 'none'} "${name}"`;
  });
