// @jest-environment @stryker-mutator/jest-runner/jest-env/node

import fs from 'fs';
import path from 'path';

import groupStyles from '@/components/ui-navigation-list/group-styles';
import sidebarStyles from '@/components/ui-sidebar/styles';
import userMenuStyles from '@/modules/user/features/settings/components/user-menu/styles';

type Direction = 'left' | 'right' | 'up' | 'down';

interface Point {
  readonly x: number;
  readonly y: number;
}

const chevronPath = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'src',
  'assets',
  'icons',
  'shell',
  'chevron-left.svg'
);

class ChevronGeometryInspector {
  public points(source: string): Point[] {
    const d = /<path\b[^>]*\sd="([^"]*)"/.exec(source)?.[1] ?? '';

    return [...d.matchAll(/[ML]\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g)].map((match) => ({
      x: Number(match[1]),
      y: Number(match[2]),
    }));
  }

  public pointing(source: string): Point {
    const [start, apex, end] = this.points(source);

    if (start === undefined || apex === undefined || end === undefined) {
      throw new Error('chevron path does not hold three points');
    }

    return { x: apex.x - (start.x + end.x) / 2, y: apex.y - (start.y + end.y) / 2 };
  }

  public rotate(vector: Point, transform: string): Point {
    const degrees = Number(/rotate\((-?[\d.]+)deg\)/.exec(transform)?.[1] ?? 0);
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.round(Math.cos(radians));
    const sin = Math.round(Math.sin(radians));

    return { x: vector.x * cos - vector.y * sin, y: vector.x * sin + vector.y * cos };
  }

  public direction(vector: Point): Direction {
    if (Math.abs(vector.x) > Math.abs(vector.y)) return vector.x < 0 ? 'left' : 'right';

    return vector.y < 0 ? 'up' : 'down';
  }
}

const inspector = new ChevronGeometryInspector();
const source = fs.readFileSync(chevronPath, 'utf8');

describe('chevron direction inspector (must-fail fixtures)', () => {
  it('reads the rotated chip-caret appearance as a downward chevron', () => {
    const rotated = '<svg><path d="M15 7.5L10 12.5L5 7.5"/></svg>';

    expect(inspector.direction(inspector.pointing(rotated))).toBe('down');
  });

  it('turns a left chevron clockwise for a positive CSS rotation', () => {
    const left: Point = { x: -5, y: 0 };

    expect(inspector.direction(inspector.rotate(left, 'rotate(90deg)'))).toBe('up');
    expect(inspector.direction(inspector.rotate(left, 'rotate(-90deg)'))).toBe('down');
    expect(inspector.direction(inspector.rotate(left, 'rotate(180deg)'))).toBe('right');
    expect(inspector.direction(inspector.rotate(left, 'none'))).toBe('left');
  });

  it('refuses a path without three points', () => {
    expect(() => inspector.pointing('<svg><path d="M1 1L2 2"/></svg>')).toThrow(
      'chevron path does not hold three points'
    );
  });
});

describe('src/assets/icons/shell/chevron-left.svg', () => {
  it('carries the Figma master geometry, unrotated', () => {
    expect(inspector.points(source)).toEqual([
      { x: 12.5, y: 15 },
      { x: 7.5, y: 10 },
      { x: 12.5, y: 5 },
    ]);
  });

  it('points left, with its apex left of both arm ends and between them vertically', () => {
    const [start, apex, end] = inspector.points(source);

    expect(apex?.x).toBeLessThan(start?.x ?? 0);
    expect(apex?.x).toBeLessThan(end?.x ?? 0);
    expect(apex?.y).toBeGreaterThan(Math.min(start?.y ?? 0, end?.y ?? 0));
    expect(apex?.y).toBeLessThan(Math.max(start?.y ?? 0, end?.y ?? 0));
    expect(inspector.direction(inspector.pointing(source))).toBe('left');
  });

  it.each<[string, string, Direction]>([
    ['the expanded collapse handle', sidebarStyles.handlePoints.expanded.transform, 'left'],
    ['the rail collapse handle', sidebarStyles.handlePoints.rail.transform, 'right'],
    ['the expanded Settings chevron', groupStyles.toggleGlyph.expanded.transform, 'up'],
    ['the collapsed Settings chevron', groupStyles.toggleGlyph.collapsed.transform, 'down'],
    ['the desktop chip caret', userMenuStyles.caret.desktop.transform, 'down'],
    ['the tablet chip caret', userMenuStyles.caret.tablet.transform, 'down'],
  ])('turns %s with %s to point %s, as Figma draws it', (_surface, transform, expected) => {
    expect(inspector.direction(inspector.rotate(inspector.pointing(source), transform))).toBe(
      expected
    );
  });
});
