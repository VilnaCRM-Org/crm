import authSkeletonStyles from '@/components/skeletons/auth-skeleton/styles';
import skeletonButtonStyles from '@/components/skeletons/ui-skeleton-button/styles';
import {
  BASE_INPUT_HEIGHT,
  MD_INPUT_HEIGHT,
  XL_INPUT_HEIGHT,
} from '@/components/skeletons/ui-skeleton-input/styles';
import breakpointsTheme from '@/components/UIBreakpoints';
import uiFormStyles from '@/components/UIForm/styles';
import authProviderButtonStyles from '@/modules/User/features/Auth/components/FormSection/components/auth-provider-buttons/styles';
import formFieldStyles from '@/modules/User/features/Auth/components/FormSection/components/styles';
import authFormSectionStyles, { fieldGapMargins } from '@/modules/User/features/Auth/components/FormSection/styles';

jest.mock('@/modules/User/features/Auth/assets/eye-off.svg', () => ({
  ReactComponent: 'svg',
}));

jest.mock('@/modules/User/features/Auth/assets/eye.svg', () => ({
  ReactComponent: 'svg',
}));

function toRem(value: string | number): number {
  if (typeof value === 'number') {
    return value;
  }

  if (!value.endsWith('rem')) {
    throw new Error(`Expected rem value, got "${value}"`);
  }

  return Number.parseFloat(value);
}

function lineBoxHeightRem(fontSize: string, lineHeight: string | number): number {
  return toRem(fontSize) * Number(lineHeight);
}

function formatRem(value: number): string {
  return `${Number(value.toFixed(6))}rem`;
}

type BreakpointName = 'base' | 'sm' | 'md' | 'lg' | 'xl';
type ResponsiveTypographyOverrides = Record<
  string,
  { fontSize?: string; lineHeight?: string | number } | undefined
>;

const BREAKPOINT_STEPS: Record<Exclude<BreakpointName, 'base'>, BreakpointName[]> = {
  sm: ['sm'],
  md: ['sm', 'md'],
  lg: ['sm', 'md', 'lg'],
  xl: ['sm', 'md', 'lg', 'xl'],
};

function mediaKey(breakpoint: Exclude<BreakpointName, 'base'>): string {
  return `@media (min-width:${breakpointsTheme.breakpoints.values[breakpoint]}px)`;
}

function valueAt(style: Record<string, unknown>, prop: string, breakpoint: BreakpointName): string {
  if (breakpoint === 'base' || breakpoint === 'sm') {
    if (breakpoint === 'sm' && style[mediaKey('sm')]) {
      const smStyle = style[mediaKey('sm')] as Record<string, string>;
      if (smStyle[prop] !== undefined) {
        return smStyle[prop];
      }
    }

    return style[prop] as string;
  }

  if (breakpoint === 'md') {
    const mdStyle = style[mediaKey('md')] as Record<string, string>;
    return (mdStyle?.[prop] ??
      (style[mediaKey('sm')] as Record<string, string>)?.[prop] ??
      style[prop]) as string;
  }

  if (breakpoint === 'lg') {
    const lgStyle = style[mediaKey('lg')] as Record<string, string>;
    return (lgStyle?.[prop] ??
      (style[mediaKey('md')] as Record<string, string>)?.[prop] ??
      (style[mediaKey('sm')] as Record<string, string>)?.[prop] ??
      style[prop]) as string;
  }

  const xlStyle = style[mediaKey('xl')] as Record<string, string>;
  return (xlStyle?.[prop] ??
    (style[mediaKey('lg')] as Record<string, string>)?.[prop] ??
    (style[mediaKey('md')] as Record<string, string>)?.[prop] ??
    (style[mediaKey('sm')] as Record<string, string>)?.[prop] ??
    style[prop]) as string;
}

function effectiveHeight(style: Record<string, unknown>, breakpoint: BreakpointName): number {
  const height = toRem(valueAt(style, 'height', breakpoint));
  const maxHeightStr = valueAt(style, 'maxHeight', breakpoint);
  return maxHeightStr ? Math.min(height, toRem(maxHeightStr)) : height;
}

const INPUT_HEIGHTS: Record<BreakpointName, number> = {
  base: BASE_INPUT_HEIGHT,
  sm: BASE_INPUT_HEIGHT,
  md: MD_INPUT_HEIGHT,
  lg: MD_INPUT_HEIGHT,
  xl: XL_INPUT_HEIGHT,
};

function inputHeightAt(breakpoint: BreakpointName): number {
  return INPUT_HEIGHTS[breakpoint];
}

const FORM_LABEL_STYLE = formFieldStyles.formFieldLabel as Record<string, unknown>;

function lineHeightAt(
  baseFontSize: string,
  baseLineHeight: string | number,
  responsive: ResponsiveTypographyOverrides,
  breakpoint: BreakpointName
): number {
  const pick = (key: BreakpointName): { fontSize?: string; lineHeight?: string | number } =>
    key === 'base' ? {} : (responsive[mediaKey(key as Exclude<BreakpointName, 'base'>)] ?? {});

  let fontSize = baseFontSize;
  let lineHeight = baseLineHeight;

  if (breakpoint !== 'base') {
    const order = BREAKPOINT_STEPS[breakpoint];

    for (const bp of order) {
      const style = pick(bp);
      if (style.fontSize !== undefined) fontSize = style.fontSize;
      if (style.lineHeight !== undefined) lineHeight = style.lineHeight;
    }
  }

  return lineBoxHeightRem(fontSize, lineHeight);
}

describe('AuthSkeleton spacing parity', () => {
  it('matches subtitle margins and height with UIForm subtitle across breakpoints', () => {
    const smKey = `@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`;
    const lgKey = `@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`;

    const baseSubtitle = uiFormStyles.formSubtitle;
    const smSubtitle = uiFormStyles.formSubtitle[smKey] as {
      fontSize: string;
      lineHeight: string | number;
    };
    const lgSubtitle = uiFormStyles.formSubtitle[lgKey] as { marginBottom: string };

    expect(authSkeletonStyles.subtitleWrapper.marginBottom).toBe(baseSubtitle.marginBottom);
    expect(
      (authSkeletonStyles.subtitleWrapper[lgKey] as { marginBottom: string }).marginBottom
    ).toBe(lgSubtitle.marginBottom);

    const baseLineBox = lineBoxHeightRem(baseSubtitle.fontSize as string, baseSubtitle.lineHeight);
    expect(toRem(authSkeletonStyles.subtitleFirstLine.height as string)).toBeCloseTo(
      baseLineBox,
      1
    );

    const smLineBox = lineBoxHeightRem(smSubtitle.fontSize, smSubtitle.lineHeight);
    expect(
      toRem((authSkeletonStyles.subtitleFirstLine[smKey] as { height: string }).height)
    ).toBeCloseTo(smLineBox, 1);
  });

  it('reserves the same bottom space as auth switcher text on all breakpoints', () => {
    const lgKey = `@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`;
    const xlKey = `@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`;

    const baseButton = authFormSectionStyles.formSwitcherButton;
    const lgButton = authFormSectionStyles.formSwitcherButton[lgKey] as {
      margin: string;
      fontSize: string;
    };
    const xlButton = authFormSectionStyles.formSwitcherButton[xlKey] as {
      margin: string;
      fontSize: string;
      lineHeight: string | number;
    };

    const baseMarginTop = toRem((baseButton.margin as string).split(' ')[0]);
    const lgMarginTop = toRem(lgButton.margin.split(' ')[0]);
    const xlMarginTop = toRem(xlButton.margin.split(' ')[0]);

    const baseLineHeight = lineBoxHeightRem(
      baseButton.fontSize as string,
      baseButton.lineHeight as string | number
    );
    const lgLineHeight = lineBoxHeightRem(
      lgButton.fontSize,
      baseButton.lineHeight as string | number
    );
    const xlLineHeight = lineBoxHeightRem(xlButton.fontSize, xlButton.lineHeight);

    const lgSwitcher = authSkeletonStyles.switcherSkeleton[lgKey] as {
      marginTop: string;
      height: string;
    };
    const xlSwitcher = authSkeletonStyles.switcherSkeleton[xlKey] as {
      marginTop: string;
      height: string;
    };

    expect(
      formatRem(
        toRem(authSkeletonStyles.switcherSkeleton.marginTop) +
          toRem(authSkeletonStyles.switcherSkeleton.height)
      )
    ).toBe(formatRem(baseMarginTop + baseLineHeight));
    expect(formatRem(toRem(lgSwitcher.marginTop) + toRem(lgSwitcher.height))).toBe(
      formatRem(lgMarginTop + lgLineHeight)
    );
    expect(formatRem(toRem(xlSwitcher.marginTop) + toRem(xlSwitcher.height))).toBe(
      formatRem(xlMarginTop + xlLineHeight)
    );
  });

  it('derives label sizing from the production form field styles', () => {
    const mdKey = `@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`;
    const lgKey = `@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`;

    expect(authSkeletonStyles.fieldLabel.marginBottom).toBe(FORM_LABEL_STYLE.marginBottom);
    expect(
      (
        authSkeletonStyles.fieldLabel[lgKey] as {
          marginBottom: string;
        }
      ).marginBottom
    ).toBe(
      (
        FORM_LABEL_STYLE[lgKey] as {
          marginBottom: string;
        }
      ).marginBottom
    );

    const baseLabelHeight = lineHeightAt(
      FORM_LABEL_STYLE.fontSize as string,
      FORM_LABEL_STYLE.lineHeight as string | number,
      FORM_LABEL_STYLE as unknown as ResponsiveTypographyOverrides,
      'base'
    );
    const mdLabelHeight = lineHeightAt(
      FORM_LABEL_STYLE.fontSize as string,
      FORM_LABEL_STYLE.lineHeight as string | number,
      FORM_LABEL_STYLE as unknown as ResponsiveTypographyOverrides,
      'md'
    );
    const lgLabelHeight = lineHeightAt(
      FORM_LABEL_STYLE.fontSize as string,
      FORM_LABEL_STYLE.lineHeight as string | number,
      FORM_LABEL_STYLE as unknown as ResponsiveTypographyOverrides,
      'lg'
    );

    expect(toRem(authSkeletonStyles.fieldLabel.height as string)).toBeCloseTo(baseLabelHeight, 2);
    expect(
      toRem((authSkeletonStyles.fieldLabel[mdKey] as { height: string }).height)
    ).toBeCloseTo(mdLabelHeight, 2);
    expect(
      toRem((authSkeletonStyles.fieldLabel[lgKey] as { height: string }).height)
    ).toBeCloseTo(lgLabelHeight, 2);
  });

  it('keeps vertical spacing increments equal to auth form blocks at every breakpoint', () => {
    const breakpoints: BreakpointName[] = ['base', 'sm', 'md', 'lg', 'xl'];

    const formTitle = uiFormStyles.formTitle as Record<string, unknown>;
    const formSubtitle = uiFormStyles.formSubtitle as Record<string, unknown>;
    const formSubmit = uiFormStyles.submitButton as Record<string, unknown>;
    const formLabel = FORM_LABEL_STYLE;
    const formFieldGap = fieldGapMargins as Record<string, unknown>;

    const skeletonTitle = authSkeletonStyles.titleSkeleton as Record<string, unknown>;
    const skeletonSubtitleLine = authSkeletonStyles.subtitleFirstLine as Record<string, unknown>;
    const skeletonSubtitleWrapper = authSkeletonStyles.subtitleWrapper as Record<string, unknown>;
    const skeletonLabel = authSkeletonStyles.fieldLabel as Record<string, unknown>;
    const skeletonFieldGap = authSkeletonStyles.fieldContainer as Record<string, unknown>;
    const skeletonSubmit = authSkeletonStyles.buttonSkeleton as Record<string, unknown>;
    const skeletonDivider = authSkeletonStyles.divider as Record<string, unknown>;

    breakpoints.forEach((breakpoint) => {
      const titleStepForm =
        lineHeightAt(
          formTitle.fontSize as string,
          formTitle.lineHeight as string | number,
          formTitle as Record<string, { fontSize?: string; lineHeight?: string | number }>,
          breakpoint
        ) + toRem(valueAt(formTitle, 'marginBottom', breakpoint));
      const titleStepSkeleton =
        toRem(valueAt(skeletonTitle, 'height', breakpoint)) +
        toRem(valueAt(skeletonTitle, 'marginBottom', breakpoint));

      const subtitleStepForm =
        lineHeightAt(
          formSubtitle.fontSize as string,
          formSubtitle.lineHeight as string | number,
          formSubtitle as Record<string, { fontSize?: string; lineHeight?: string | number }>,
          breakpoint
        ) + toRem(valueAt(formSubtitle, 'marginBottom', breakpoint));
      const subtitleStepSkeleton =
        toRem(valueAt(skeletonSubtitleLine, 'height', breakpoint)) +
        toRem(valueAt(skeletonSubtitleWrapper, 'marginBottom', breakpoint));

      const labelToInputForm =
        lineHeightAt(
          formLabel.fontSize as string,
          formLabel.lineHeight as string | number,
          formLabel as Record<string, { fontSize?: string; lineHeight?: string | number }>,
          breakpoint
        ) + toRem(valueAt(formLabel, 'marginBottom', breakpoint));
      const labelToInputSkeleton =
        toRem(valueAt(skeletonLabel, 'height', breakpoint)) +
        toRem(valueAt(skeletonLabel, 'marginBottom', breakpoint));

      const inputToLabelForm =
        inputHeightAt(breakpoint) + toRem(valueAt(formFieldGap, 'marginBottom', breakpoint));
      const inputToLabelSkeleton =
        inputHeightAt(breakpoint) + toRem(valueAt(skeletonFieldGap, 'marginBottom', breakpoint));

      const inputToSubmitForm =
        inputHeightAt(breakpoint) + toRem(valueAt(formSubmit, 'marginTop', breakpoint));
      const inputToSubmitSkeleton =
        inputHeightAt(breakpoint) + toRem(valueAt(skeletonSubmit, 'marginTop', breakpoint));

      const submitToDividerForm =
        effectiveHeight(formSubmit, breakpoint) +
        toRem(
          valueAt(
            authProviderButtonStyles.thirdPartyWrapper as Record<string, unknown>,
            'marginTop',
            breakpoint
          )
        );
      const submitToDividerSkeleton =
        toRem(
          valueAt(
            skeletonButtonStyles.buttonSkeleton as Record<string, unknown>,
            'height',
            breakpoint
          )
        ) + toRem(valueAt(skeletonDivider, 'marginTop', breakpoint));

      expect(titleStepSkeleton).toBeCloseTo(titleStepForm, 2);
      expect(subtitleStepSkeleton).toBeCloseTo(subtitleStepForm, 2);
      expect(labelToInputSkeleton).toBeCloseTo(labelToInputForm, 2);
      expect(inputToLabelSkeleton).toBeCloseTo(inputToLabelForm, 2);
      expect(inputToSubmitSkeleton).toBeCloseTo(inputToSubmitForm, 2);
      expect(submitToDividerSkeleton).toBeCloseTo(submitToDividerForm, 2);
    });
  });
});
