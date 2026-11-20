import { readdirSync, readFileSync } from 'fs';
import { join, relative, resolve } from 'path';

const NOTIFICATIONS_ROOT = resolve(__dirname, '../../../../src/lib/notifications');
const FORBIDDEN_ALIAS = /^(@\/(modules|components|hooks|providers|services)|@auth)(\/|$)/;
const SPECIFIER_PATTERNS = [
  /\b(?:import|export)\b[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
];

const listSources = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listSources(path) : [path];
  });

const readSpecifiers = (source: string): string[] =>
  SPECIFIER_PATTERNS.flatMap((pattern) =>
    Array.from(source.matchAll(pattern), (match) => match[1] ?? '')
  );

const escapes = (file: string, specifier: string): boolean => {
  if (FORBIDDEN_ALIAS.test(specifier)) return true;
  if (!specifier.startsWith('.')) return false;
  const target = resolve(file, '..', specifier);
  return relative(NOTIFICATIONS_ROOT, target).startsWith('..');
};

describe('src/lib/notifications import graph', () => {
  it('has source files to check', () => {
    expect(listSources(NOTIFICATIONS_ROOT).length).toBeGreaterThanOrEqual(8);
  });

  it.each(
    listSources(NOTIFICATIONS_ROOT).map((file) => [relative(NOTIFICATIONS_ROOT, file), file])
  )('%s reaches no module, component, hook, provider or service', (_name, file) => {
    const offending = readSpecifiers(readFileSync(String(file), 'utf8')).filter((specifier) =>
      escapes(String(file), specifier)
    );

    expect(offending).toEqual([]);
  });

  describe('the scanner itself', () => {
    const file = join(NOTIFICATIONS_ROOT, 'probe.ts');

    it.each([
      ["import { x } from '@/modules/user';"],
      ["import type { X } from '@/components/types/ui-toast';"],
      ["import useY from '@/hooks/use-y';"],
      ["export { z } from '@/providers/di';"],
      ["import '@/services/error';"],
      ["const lazy = import('@/modules/user');"],
      ["import { x } from '@auth/stores';"],
      ["import { x } from '../hooks/use-x';"],
    ])('flags %s', (line) => {
      const flagged = readSpecifiers(line).filter((specifier) => escapes(file, specifier));

      expect(flagged).toHaveLength(1);
    });

    it.each([
      ["import { create } from 'zustand';"],
      ["import type { RefObject } from 'react';"],
      ["import ALTERNATING_MARK from '@/lib/live-region/alternating-mark';"],
      ["import type { A } from './types/a';"],
    ])('passes %s', (line) => {
      const flagged = readSpecifiers(line).filter((specifier) => escapes(file, specifier));

      expect(flagged).toEqual([]);
    });
  });
});
