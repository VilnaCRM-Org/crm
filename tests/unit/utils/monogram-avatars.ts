import { screen, within } from '@testing-library/react';

/**
 * The avatar paints its monogram as CSS generated content from `data-monogram`, so it has no text
 * node for `getByText` to find: a DOM text node would count as the chip's visible label and break
 * WCAG 2.5.3 Label in Name (axe `label-content-name-mismatch`). Avatars are aria-hidden boxes, so
 * they are read as hidden `generic` roles and picked by the attribute.
 */
export const monogramAvatars = (monogram: string, root?: HTMLElement): HTMLElement[] =>
  (root === undefined ? screen : within(root))
    .queryAllByRole('generic', { hidden: true })
    .filter((box) => box.getAttribute('data-monogram') === monogram);

export const getMonogramAvatar = (monogram: string, root?: HTMLElement): HTMLElement => {
  const found = monogramAvatars(monogram, root);
  const [only] = found;

  if (only === undefined || found.length !== 1) {
    throw new Error(`expected one avatar painting "${monogram}", found ${found.length}`);
  }

  return only;
};
