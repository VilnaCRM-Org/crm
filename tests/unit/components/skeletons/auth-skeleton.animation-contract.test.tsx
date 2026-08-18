import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import AuthSkeleton from '@/components/skeletons/auth-skeleton';

const SHIMMER_BACKGROUND_SIZE = '200% 100%';
const STATIC_BACKGROUND_SIZE = '100% 100%';
const FIELD_GAP = '0.5rem';
const LAST_FIELD_GAP = '0px';
const TITLE_WIDTH = '7.5rem';
const TITLE_HEIGHT = '1.375rem';
const CARD_BORDER_RADIUS = '16px';

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

function skeletons(): HTMLElement[] {
  return screen.getAllByRole('generic');
}

function skeletonById(id: string): HTMLElement {
  const element = skeletons().find((candidate) => candidate.id === id);
  if (!element) {
    throw new Error(`No skeleton rendered with id "${id}"`);
  }
  return element;
}

function wrapperOf(id: string): HTMLElement {
  const all = skeletons();
  const index = all.findIndex((candidate) => candidate.id === id);
  if (index < 1) {
    throw new Error(`No wrapper rendered around "${id}"`);
  }
  return all[index - 1];
}

describe('AuthSkeleton animation and spacing contract', () => {
  it('shimmers every block by default', () => {
    render(<AuthSkeleton />);

    const title = skeletonById('auth-skeleton-title');
    expect(title).toHaveStyle({ backgroundSize: SHIMMER_BACKGROUND_SIZE });
    expect(title).not.toHaveStyle({ animation: 'none' });
  });

  it('shimmers every block when animation is explicitly enabled', () => {
    render(<AuthSkeleton disableAnimation={false} />);

    expect(skeletonById('auth-skeleton-switcher')).toHaveStyle({
      backgroundSize: SHIMMER_BACKGROUND_SIZE,
    });
  });

  it('keeps each block sized while freezing it when animation is disabled', () => {
    render(<AuthSkeleton disableAnimation />);

    expect(skeletonById('auth-skeleton-title')).toHaveStyle({
      animation: 'none',
      backgroundSize: STATIC_BACKGROUND_SIZE,
      width: TITLE_WIDTH,
      height: TITLE_HEIGHT,
    });
  });

  it('renders the form inside the elevated card', () => {
    render(<AuthSkeleton />);

    expect(wrapperOf('auth-skeleton-title')).toHaveStyle({
      borderRadius: CARD_BORDER_RADIUS,
      position: 'relative',
      width: '100%',
    });
  });

  it('gaps every field row except the last one', () => {
    render(<AuthSkeleton />);

    expect(wrapperOf('auth-skeleton-field-label-1')).toHaveStyle({ marginBottom: FIELD_GAP });
    expect(wrapperOf('auth-skeleton-field-label-2')).toHaveStyle({ marginBottom: FIELD_GAP });
    expect(wrapperOf('auth-skeleton-field-label-3')).toHaveStyle({ marginBottom: LAST_FIELD_GAP });
    expect(wrapperOf('auth-skeleton-field-label-1')).not.toHaveStyle({
      marginBottom: LAST_FIELD_GAP,
    });
  });
});
