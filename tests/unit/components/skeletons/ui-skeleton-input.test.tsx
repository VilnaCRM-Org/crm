import { render, screen } from '@testing-library/react';

import UISkeletonInput from '@/components/skeletons/ui-skeleton-input';
import { mediaStyleRuleFor, styleRuleFor } from '@tests/unit/utils/emotion-style-rules';

const SKELETON_ID = 'skeleton-input';
const PLACEHOLDER_CLASS = 'ui-skeleton-input__placeholder';

function hiddenGenerics(): HTMLElement[] {
  return screen.getAllByRole('generic', { hidden: true });
}

function skeletonInput(): HTMLElement {
  const element = hiddenGenerics().find((el) => el.id === SKELETON_ID);
  if (!element) throw new Error(`Skeleton input element with id "${SKELETON_ID}" not found`);
  return element;
}

function placeholders(): HTMLElement[] {
  return hiddenGenerics().filter((el) => el.classList.contains(PLACEHOLDER_CLASS));
}

function placeholder(): HTMLElement {
  const [element] = placeholders();
  if (!element) throw new Error(`${PLACEHOLDER_CLASS} not found`);
  return element;
}

describe('UISkeletonInput', () => {
  it('renders a decorative field hidden from assistive technology', () => {
    render(<UISkeletonInput id={SKELETON_ID} />);

    expect(skeletonInput()).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryAllByRole('generic').map((el) => el.id)).not.toContain(SKELETON_ID);
  });

  it('renders exactly one placeholder bar inside the field', () => {
    render(<UISkeletonInput id={SKELETON_ID} />);

    expect(placeholders()).toHaveLength(1);
    expect(placeholder()).not.toHaveAttribute('id');
  });

  it('shapes the field as a full-width rounded box that grows with the viewport', () => {
    render(<UISkeletonInput id={SKELETON_ID} />);

    expect(skeletonInput()).toHaveStyle({
      position: 'relative',
      boxSizing: 'border-box',
      borderRadius: '0.5rem',
      width: '100%',
      backgroundSize: '200% 100%',
    });
    expect(styleRuleFor(skeletonInput())?.getPropertyValue('height')).toBe(
      'clamp(3rem, 4vw, 4rem)'
    );
  });

  it('paints the field interior with the theme background over a 1px shimmer border', () => {
    render(<UISkeletonInput id={SKELETON_ID} />);

    const after = styleRuleFor(skeletonInput(), '::after');

    expect(after?.getPropertyValue('inset')).toBe('1px');
    expect(after?.getPropertyValue('border-radius')).toBe('calc(0.5rem - 1px)');
    expect(after?.getPropertyValue('background-color')).toBe('#fff');
  });

  it.each([
    ['min-width:375px', 'min-width', '19.6875rem'],
    ['min-width:768px', 'height', '4.9375rem'],
    ['min-width:768px', 'min-width', '33.75rem'],
    ['min-width:1024px', 'min-width', '26.375rem'],
    ['min-width:1440px', 'max-height', '4rem'],
  ])('at %s sets the field %s to %s', (mediaFragment, property, value) => {
    render(<UISkeletonInput id={SKELETON_ID} />);

    expect(mediaStyleRuleFor(skeletonInput(), mediaFragment)?.getPropertyValue(property)).toBe(
      value
    );
  });

  it('places the placeholder bar vertically centred above the field interior', () => {
    render(<UISkeletonInput id={SKELETON_ID} />);

    expect(placeholder()).toHaveStyle({
      position: 'absolute',
      zIndex: '1',
      width: '9.1875rem',
      height: '1.125rem',
      left: '1.25rem',
      top: '50%',
      transform: 'translateY(-50%)',
      borderRadius: '3.5625rem',
    });
  });

  it.each([
    ['min-width:768px', '1.75rem'],
    ['min-width:1440px', '1.6875rem'],
  ])('at %s moves the placeholder bar to %s from the left', (mediaFragment, left) => {
    render(<UISkeletonInput id={SKELETON_ID} />);

    expect(mediaStyleRuleFor(placeholder(), mediaFragment)?.getPropertyValue('left')).toBe(left);
  });

  it('stops both layers from shimmering for users who prefer reduced motion', () => {
    render(<UISkeletonInput id={SKELETON_ID} />);

    [skeletonInput(), placeholder()].forEach((layer) => {
      expect(
        mediaStyleRuleFor(layer, 'prefers-reduced-motion:reduce')?.getPropertyValue('animation')
      ).toBe('none');
    });
  });

  it('freezes both layers with the static background when animation is disabled', () => {
    render(<UISkeletonInput disableAnimation id={SKELETON_ID} />);

    [skeletonInput(), placeholder()].forEach((layer) => {
      expect(layer).toHaveStyle({ animation: 'none', backgroundSize: '100% 100%' });
    });
  });

  it('has no interactive or form elements', () => {
    render(<UISkeletonInput id={SKELETON_ID} />);

    ['button', 'link', 'textbox', 'checkbox', 'combobox'].forEach((role) => {
      expect(screen.queryAllByRole(role, { hidden: true })).toHaveLength(0);
    });
  });
});
