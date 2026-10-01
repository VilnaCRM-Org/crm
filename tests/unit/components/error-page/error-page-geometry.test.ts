import loadIsolated from '@tests/unit/utils/isolated-module';

type ErrorPageGeometryModule = typeof import('@/components/error-page/error-page-geometry');
type Leaves = Record<string, unknown>;
type Row = [path: string, desktop: unknown, tablet: unknown, mobile: unknown];

const loadGeometry = async (): Promise<ErrorPageGeometryModule['default']> => {
  const { default: geometry } = await loadIsolated(
    () => import('@/components/error-page/error-page-geometry')
  );
  return geometry;
};

const flatten = (value: unknown, path: string, leaves: Leaves): Leaves => {
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).reduce(
      (acc, [key, child]) => flatten(child, path === '' ? key : `${path}.${key}`, acc),
      leaves
    );
  }
  return { ...leaves, [path]: value };
};

const ROWS: Row[] = [
  ['page.paddingTop', 76, 76, 43.61],
  ['page.paddingBottom', 121, 121, 73.91],
  ['composition.width', 614, 474, 350.348],
  ['composition.paddingBottom', 0, 0, 78.87],
  ['digits.width', 466, 466, 344.435],
  ['digits.height', 330, 330, 243.913],
  ['digits.fontSize', 244.5, 244.5, 154.462],
  ['digits.lineHeight', 293.4, 293.4, 185.355],
  ['digits.shadowOffset', 4, 4, 2.527],
  ['digits.glyphs.0.x', 0, 0, 27.739],
  ['digits.glyphs.0.y', 0, 0, 14.582],
  ['digits.glyphs.1.x', 147, 147, 120.606],
  ['digits.glyphs.1.y', 36, 36, 37.324],
  ['digits.glyphs.2.x', 301, 301, 217.896],
  ['digits.glyphs.2.y', 0, 0, 14.582],
  ['card.border', 1, 1, 0.739],
  ['card.radius', 16, 16, 11.826],
  ['card.shadowY', 4, 4, 2.957],
  ['card.shadowBlur', 31, 31, 22.913],
  ['card.textInset', 24, 24, 16],
  ['card.titleSize', 36, 36, 22],
  ['card.titleWeight', 600, 600, 700],
  ['card.width', 614, 474, 350.348],
  ['card.height', 222, 235, 173.696],
  ['card.top', 29, 24, 26.476],
  ['card.titleLine', 43, 43, 26],
  ['card.gapTitle', 6, 4, 3.74],
  ['card.descSize', 16, 18, 15],
  ['card.descLine', 26, 30, 25],
  ['card.gapActions', 24, 24, 16],
  ['card.actionsHeight', 62, 70, 50],
  ['card.bottom', 32, 40, 26.48],
  ['button.height', 62, 70, 50],
  ['button.paddingX', 32, 44, 24],
  ['button.labelSize', 18, 18, 15],
  ['button.labelLine', 22, 22, 18],
  ['button.labelWeight', 600, 600, 500],
  ['tab.left', 37, 26, 19.216],
  ['tab.right', 37, 27, 19.958],
  ['tab.y', 301, 301, 222.478],
  ['tab.height', 225, 225, 166.304],
  ['tab.radius', 32, 32, 23.652],
  ['curve.x', -56, -84.303, 2.695],
  ['curve.y', 36, 36, 58.388],
  ['curve.width', 643, 654.86, 360],
  ['curve.height', 357, 357, 200],
  ['diamond.x', 44, 17.541, 10.346],
  ['diamond.y', 54, 54, 39.912],
  ['diamond.width', 40, 40.738, 29.565],
  ['diamond.height', 40, 40, 29.565],
  ['dot.x', 574.921, 558.255, undefined],
  ['dot.y', 99.928, 99.928, undefined],
  ['dot.width', 10.338, 10.529, undefined],
  ['dot.height', 10.354, 10.354, undefined],
  ['dotColumns.x', -80, -79.211, undefined],
  ['dotColumns.y', 376, 376, undefined],
  ['dotColumns.width', 59.09, 60.181, undefined],
  ['dotColumns.height', 161.541, 161.541, undefined],
  ['dotRows', null, null, undefined],
  ['dot', undefined, undefined, null],
  ['dotColumns', undefined, undefined, null],
  ['dotRows.width', undefined, undefined, 161.541],
  ['dotRows.height', undefined, undefined, 59.091],
  ['dotRows.gapBelowCard', undefined, undefined, 19.779],
];

describe('error page geometry table', () => {
  it.each(ROWS)('pins %s to appendix A', async (path, desktop, tablet, mobile) => {
    const geometry = await loadGeometry();

    expect(flatten(geometry.desktop, '', {})[path]).toBe(desktop);
    expect(flatten(geometry.tablet, '', {})[path]).toBe(tablet);
    expect(flatten(geometry.mobile, '', {})[path]).toBe(mobile);
  });

  it('pins every leaf the table holds', async () => {
    const geometry = await loadGeometry();

    const paths = new Set(
      Object.values(geometry).flatMap((record) => Object.keys(flatten(record, '', {})))
    );

    expect([...paths].sort()).toEqual(ROWS.map(([path]) => path).sort());
  });

  it('shares one page and one digit record between desktop and tablet', async () => {
    const { desktop, tablet } = await loadGeometry();

    expect(tablet.page).toBe(desktop.page);
    expect(tablet.digits).toBe(desktop.digits);
  });

  it('sums each card rhythm to the drawn card height', async () => {
    const geometry = await loadGeometry();

    const sums = Object.values(geometry).map(
      ({ card }) =>
        card.top +
        card.titleLine +
        card.gapTitle +
        card.descLine +
        card.gapActions +
        card.actionsHeight +
        card.bottom
    );

    expect(sums.map((sum) => Number(sum.toFixed(3)))).toEqual([222, 235, 173.696]);
  });

  it('holds exactly the three breakpoints', async () => {
    const geometry = await loadGeometry();

    expect(Object.keys(geometry)).toEqual(['desktop', 'tablet', 'mobile']);
  });
});
