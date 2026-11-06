import { type RefCallback, useState } from 'react';

import type { ChipNameGrowth } from '../types/hooks/use-chip-name-growth';

function measureGrowth(node: HTMLElement): number {
  const style = window.getComputedStyle(node);
  const scale =
    Number.parseFloat(style.fontSize) /
      Number.parseFloat(style.getPropertyValue('--chip-name-base')) || 1;
  const [spaced = 0, rest = 0] = [...node.children].map(
    (copy) => copy.getBoundingClientRect().width
  );

  return Math.max(0, Math.ceil(spaced - rest / scale));
}

export default function useChipNameGrowth(): ChipNameGrowth {
  const [grow, setGrow] = useState(0);
  const [sizers] = useState<RefCallback<HTMLElement>>(
    () =>
      (node: HTMLElement | null): (() => void) | undefined => {
        if (node === null || typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(() => setGrow(measureGrowth(node)));
        [...node.children].forEach((copy) => observer.observe(copy));

        return (): void => observer.disconnect();
      }
  );

  return { grow, sizers };
}
