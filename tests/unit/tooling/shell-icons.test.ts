// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

type GlyphPaint = 'stroke' | 'fill';

interface ViewBox {
  readonly width: number;
  readonly height: number;
}

const shellDir = path.resolve(__dirname, '..', '..', '..', 'src', 'assets', 'icons', 'shell');

const STROKE_GLYPHS = [
  'bell-01',
  'chevron-left',
  'dataflow-02',
  'dotpoints-01',
  'globe-02',
  'layout-alt-01',
  'line-chart-up-03',
  'log-in-02',
  'menu-04',
  'message-square-01',
  'monitor-01',
  'receipt',
  'settings-02',
  'shopping-bag-01',
  'x-close',
] as const;

const FILLED_GLYPHS = ['search'] as const;

const LOGO_BOXES: Readonly<Record<string, ViewBox>> = {
  'logo-desktop': { width: 143, height: 48.12 },
  'logo-mobile': { width: 125, height: 42.07 },
};

const HARD_CODED_COLOUR = /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|\b(?:white|black)\b/i;

class ShellSvgInspector {
  public rootTag(source: string): string {
    return /<svg\b[^>]*>/i.exec(source)?.[0] ?? '';
  }

  public attribute(tag: string, name: string): string | undefined {
    return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
  }

  public viewBox(source: string): ViewBox | undefined {
    const parts = (this.attribute(this.rootTag(source), 'viewBox') ?? '')
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const [minX, minY, width, height] = parts;
    const valid =
      parts.length === 4 && minX === 0 && minY === 0 && Number(width) > 0 && Number(height) > 0;

    return valid ? { width: Number(width), height: Number(height) } : undefined;
  }

  public childPaints(source: string, name: 'fill' | 'stroke'): string[] {
    const body = source.slice(source.indexOf(this.rootTag(source)) + this.rootTag(source).length);

    return [...body.matchAll(new RegExp(`\\s${name}="([^"]*)"`, 'g'))].map(
      (match) => match[1] ?? ''
    );
  }

  public violations(source: string, paint: GlyphPaint): string[] {
    const found: string[] = [];
    const root = this.rootTag(source);
    const painted = this.childPaints(source, paint);
    const other = this.childPaints(source, paint === 'stroke' ? 'fill' : 'stroke');

    if (root === '') found.push('no <svg> root');
    if (this.attribute(root, 'fill') !== 'none') found.push('root fill is not "none"');
    if (this.viewBox(source) === undefined) found.push('no viewBox');
    if (HARD_CODED_COLOUR.test(source)) found.push('hard-coded colour');
    if (painted.length === 0) found.push(`no ${paint} paint`);
    if (painted.some((value) => value !== 'currentColor'))
      found.push(`${paint} is not currentColor`);
    if (other.some((value) => value !== 'none'))
      found.push(`unexpected ${paint === 'stroke' ? 'fill' : 'stroke'}`);

    return found;
  }
}

const inspector = new ShellSvgInspector();

const SVG_NAMESPACE = 'xmlns="http://www.w3.org/2000/svg"';

const VALID_STROKE =
  `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" ${SVG_NAMESPACE}>` +
  '<path d="M3 3H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

const VALID_FILL =
  `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" ${SVG_NAMESPACE}>` +
  '<path d="M1 1H19V19H1Z" fill="currentColor"/></svg>';

const read = (name: string): string => fs.readFileSync(path.join(shellDir, `${name}.svg`), 'utf8');

describe('shell svg inspector (must-fail fixtures)', () => {
  it('accepts a currentColor stroke glyph and a currentColor filled glyph', () => {
    expect(inspector.violations(VALID_STROKE, 'stroke')).toEqual([]);
    expect(inspector.violations(VALID_FILL, 'fill')).toEqual([]);
  });

  it('rejects a glyph whose stroke is a hard-coded hex colour', () => {
    const fixture = VALID_STROKE.replace('stroke="currentColor"', 'stroke="#969B9D"');

    expect(inspector.violations(fixture, 'stroke')).toEqual([
      'hard-coded colour',
      'stroke is not currentColor',
    ]);
  });

  it('rejects a glyph whose stroke is a named colour, as edit-02.svg ships', () => {
    const fixture = VALID_STROKE.replace('stroke="currentColor"', 'stroke="white"');

    expect(inspector.violations(fixture, 'stroke')).toEqual([
      'hard-coded colour',
      'stroke is not currentColor',
    ]);
  });

  it('rejects a glyph with no viewBox', () => {
    const fixture = VALID_STROKE.replace(' viewBox="0 0 24 24"', '');

    expect(inspector.violations(fixture, 'stroke')).toEqual(['no viewBox']);
  });

  it('rejects a viewBox that is offset, short or empty', () => {
    expect(inspector.viewBox(VALID_STROKE.replace('0 0 24 24', '1 0 24 24'))).toBeUndefined();
    expect(inspector.viewBox(VALID_STROKE.replace('0 0 24 24', '0 1 24 24'))).toBeUndefined();
    expect(inspector.viewBox(VALID_STROKE.replace('0 0 24 24', '0 0 24'))).toBeUndefined();
    expect(inspector.viewBox(VALID_STROKE.replace('0 0 24 24', '0 0 0 24'))).toBeUndefined();
    expect(inspector.viewBox(VALID_STROKE.replace('0 0 24 24', '0 0 24 0'))).toBeUndefined();
    expect(inspector.viewBox(VALID_STROKE)).toEqual({ width: 24, height: 24 });
  });

  it('rejects a root that paints a fill, so SvgIcon cannot fill the glyph solid', () => {
    const fixture = VALID_STROKE.replace('fill="none" xmlns', 'fill="currentColor" xmlns');

    expect(inspector.violations(fixture, 'stroke')).toEqual(['root fill is not "none"']);
  });

  it('rejects a stroke glyph that also fills a child, and a filled glyph that strokes one', () => {
    const filledStroke = VALID_STROKE.replace('stroke-width', 'fill="currentColor" stroke-width');
    const strokedFill = VALID_FILL.replace(
      'fill="currentColor"',
      'fill="currentColor" stroke="currentColor"'
    );

    expect(inspector.violations(filledStroke, 'stroke')).toEqual(['unexpected fill']);
    expect(inspector.violations(strokedFill, 'fill')).toEqual(['unexpected stroke']);
  });

  it('rejects a glyph with no paint at all and a file with no svg root', () => {
    expect(
      inspector.violations(VALID_STROKE.replace(' stroke="currentColor"', ''), 'stroke')
    ).toEqual(['no stroke paint']);
    expect(inspector.violations('<path d="M0 0"/>', 'fill')).toEqual([
      'no <svg> root',
      'root fill is not "none"',
      'no viewBox',
      'no fill paint',
    ]);
  });
});

describe('src/assets/icons/shell', () => {
  it('holds exactly the shell glyphs and the two exported logos', () => {
    const expected = [...STROKE_GLYPHS, ...FILLED_GLYPHS, ...Object.keys(LOGO_BOXES)]
      .map((name) => `${name}.svg`)
      .sort();

    expect(fs.readdirSync(shellDir).sort()).toEqual(expected);
  });

  it.each(STROKE_GLYPHS)('%s.svg strokes in currentColor on a fill="none" root', (name) => {
    expect(inspector.violations(read(name), 'stroke')).toEqual([]);
  });

  it.each(FILLED_GLYPHS)(
    '%s.svg fills in currentColor, as the magnifier is drawn (V-7)',
    (name) => {
      expect(inspector.violations(read(name), 'fill')).toEqual([]);
    }
  );

  it.each(Object.entries(LOGO_BOXES))('%s.svg keeps the Figma box %o', (name, box) => {
    const viewBox = inspector.viewBox(read(name));

    expect(viewBox?.width).toBeCloseTo(box.width, 2);
    expect(viewBox?.height).toBeCloseTo(box.height, 2);
  });
});
