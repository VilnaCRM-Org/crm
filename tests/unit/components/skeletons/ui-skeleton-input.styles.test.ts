import skeletonInputStyles, {
  BASE_INPUT_HEIGHT,
  MD_INPUT_HEIGHT,
  SKELETON_INPUT_BORDER_GRADIENT,
  SKELETON_INPUT_OUTER_BACKGROUND,
  XL_INPUT_HEIGHT,
} from '@/components/skeletons/ui-skeleton-input/styles';
import colorTheme from '@/components/ui-color-theme';

/**
 * Style modules are design contracts: the literal IS the test case, so these are pinned values
 * rather than Faker data. A dropped or edited token fails here instead of silently shipping.
 */
describe('ui-skeleton-input styles', () => {
  it('pins the shared height and gradient tokens', () => {
    expect(BASE_INPUT_HEIGHT).toBe(3);
    expect(MD_INPUT_HEIGHT).toBe(4.9375);
    expect(XL_INPUT_HEIGHT).toBe(4);
    expect(SKELETON_INPUT_OUTER_BACKGROUND).toBe('linear-gradient(#fff, #fff)');
    expect(SKELETON_INPUT_BORDER_GRADIENT).toBe(
      'linear-gradient(90deg, rgba(211, 216, 224, 0.78) 0%, ' +
        'rgba(211, 216, 224, 0.598958) 49.13%, rgba(211, 216, 224, 0) 100%)'
    );
  });

  it('pins the static skeleton token', () => {
    expect(skeletonInputStyles.staticSkeleton).toEqual({
      animation: 'none',
      backgroundSize: '100% 100%',
    });
  });

  it('pins the input placeholder token', () => {
    expect(skeletonInputStyles.inputPlaceholder).toEqual({
      backgroundImage:
        'linear-gradient(\n' +
        '  90deg,\n' +
        '  rgba(211, 216, 224, 0) 0%,\n' +
        '  rgba(211, 216, 224, 0.6) 49.13%,\n' +
        '  rgba(211, 216, 224, 0) 100%\n' +
        ')',
      backgroundSize: '200% 100%',
      animation:
        '_EMO_animation-8w0i0i_@keyframes animation-8w0i0i{\n' +
        '  0% {\n' +
        '    background-position: 0% 0;\n' +
        '  }\n' +
        '  100% {\n' +
        '    background-position: 100% 0;\n' +
        '  }\n' +
        '}_EMO_ 1.5s ease-in-out infinite alternate',
      position: 'absolute',
      zIndex: 1,
      width: '9.1875rem',
      height: '1.125rem',
      left: '1.25rem',
      top: '50%',
      transform: 'translateY(-50%)',
      borderRadius: '3.5625rem',
      '@media (min-width:768px)': {
        left: '1.75rem',
      },
      '@media (min-width:1440px)': {
        left: '1.6875rem',
      },
    });
  });

  it('builds the input container from the supplied theme', () => {
    expect(skeletonInputStyles.inputContainer(colorTheme)).toEqual({
      position: 'relative',
      boxSizing: 'border-box',
      borderRadius: '0.5rem',
      height: 'clamp(3rem, 4vw, 4rem)',
      width: '100%',
      backgroundImage:
        'linear-gradient(\n' +
        '  90deg,\n' +
        '  rgba(211, 216, 224, 0) 0%,\n' +
        '  rgba(211, 216, 224, 0.6) 49.13%,\n' +
        '  rgba(211, 216, 224, 0) 100%\n' +
        ')',
      backgroundSize: '200% 100%',
      animation:
        '_EMO_animation-8w0i0i_@keyframes animation-8w0i0i{\n' +
        '  0% {\n' +
        '    background-position: 0% 0;\n' +
        '  }\n' +
        '  100% {\n' +
        '    background-position: 100% 0;\n' +
        '  }\n' +
        '}_EMO_ 1.5s ease-in-out infinite alternate',
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: '1px',
        borderRadius: 'calc(0.5rem - 1px)',
        backgroundColor: '#fff',
      },
      '@media (min-width:375px)': {
        minWidth: '19.6875rem',
      },
      '@media (min-width:768px)': {
        height: '4.9375rem',
        minWidth: '33.75rem',
      },
      '@media (min-width:1024px)': {
        minWidth: '26.375rem',
      },
      '@media (min-width:1440px)': {
        maxHeight: '4rem',
      },
    });
  });

  it('reads the overlay colour from the theme rather than hardcoding it', () => {
    const themed = skeletonInputStyles.inputContainer(colorTheme) as Record<
      string,
      Record<string, unknown>
    >;

    expect(themed['&::after']?.backgroundColor).toBe(colorTheme.palette.background.default);
  });
});
