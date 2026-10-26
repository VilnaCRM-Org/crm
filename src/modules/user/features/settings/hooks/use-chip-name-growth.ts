import { type RefCallback, useState } from 'react';

import type { ChipNameGrowth } from '../types/hooks/use-chip-name-growth';

export default function useChipNameGrowth(): ChipNameGrowth {
  const [grow, setGrow] = useState(0);
  const [sizers] = useState<RefCallback<HTMLElement>>(
    () =>
      (node: HTMLElement | null): (() => void) | undefined => {
        if (node === null || typeof ResizeObserver === 'undefined') return undefined;
        const copies = [...node.children];
        const observer = new ResizeObserver(() => {
          const [spaced = 0, rest = 0] = copies.map((copy) => copy.getBoundingClientRect().width);
          setGrow(Math.max(0, Math.ceil(spaced - rest)));
        });
        copies.forEach((copy) => observer.observe(copy));

        return (): void => observer.disconnect();
      }
  );

  return { grow, sizers };
}
