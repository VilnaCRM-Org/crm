import type { CSSObject } from '@emotion/react';

import type { FallbackLandmark } from '@/components/types/error-boundary';

export type ErrorPageVariantId = 'notFound' | 'forbidden' | 'serverError';
export type ErrorPageHomeAppearance = 'contained' | 'outlined';
export type ErrorPageBreakpoint = 'desktop' | 'tablet' | 'mobile';

export interface ErrorPageVariant {
  glyphs: readonly [string, string, string];
  digitColor: string;
  digitShadowColor: string;
  titleKey: string;
  descriptionKey: string;
  codeKey: string;
  homeAppearance: ErrorPageHomeAppearance;
  requestAccess: boolean;
}

export interface ErrorPageProps {
  variant: ErrorPageVariantId;
  landmark: FallbackLandmark;
}

export interface ErrorPagePageGeometry {
  paddingTop: number;
  paddingBottom: number;
}

export interface ErrorPageCompositionGeometry {
  width: number;
  paddingBottom: number;
}

export interface ErrorPageGlyphPosition {
  x: number;
  y: number;
}

export interface ErrorPageDigitGeometry {
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
  shadowOffset: number;
  glyphs: readonly [ErrorPageGlyphPosition, ErrorPageGlyphPosition, ErrorPageGlyphPosition];
}

export interface ErrorPageCardSurfaceGeometry {
  border: number;
  radius: number;
  shadowY: number;
  shadowBlur: number;
  textInset: number;
  titleSize: number;
  titleWeight: number;
}

export interface ErrorPageCardGeometry extends ErrorPageCardSurfaceGeometry {
  width: number;
  height: number;
  top: number;
  titleLine: number;
  gapTitle: number;
  descSize: number;
  descLine: number;
  gapActions: number;
  actionsHeight: number;
  bottom: number;
}

export interface ErrorPageButtonGeometry {
  height: number;
  paddingX: number;
  labelSize: number;
  labelLine: number;
  labelWeight: number;
}

export interface ErrorPageTabGeometry {
  left: number;
  right: number;
  y: number;
  height: number;
  radius: number;
}

export interface ErrorPageBoxGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ErrorPageDotRowsGeometry {
  width: number;
  height: number;
  gapBelowCard: number;
}

export interface ErrorPageGeometry {
  page: ErrorPagePageGeometry;
  composition: ErrorPageCompositionGeometry;
  digits: ErrorPageDigitGeometry;
  card: ErrorPageCardGeometry;
  button: ErrorPageButtonGeometry;
  tab: ErrorPageTabGeometry;
  curve: ErrorPageBoxGeometry;
  diamond: ErrorPageBoxGeometry;
  dot: ErrorPageBoxGeometry | null;
  dotColumns: ErrorPageBoxGeometry | null;
  dotRows: ErrorPageDotRowsGeometry | null;
}

export type ErrorPageGeometryTable = Record<ErrorPageBreakpoint, ErrorPageGeometry>;

export interface ErrorPageMediaQueries {
  tablet: string;
  mobile: string;
}

export type ErrorPageStyleToken = 'landmark' | 'composition';
export type ErrorPageStyleSheet = Record<ErrorPageStyleToken, CSSObject>;

export type ErrorPageCardStyleToken = 'card' | 'title' | 'description' | 'statusCode';
export type ErrorPageCardStyleSheet = Record<ErrorPageCardStyleToken, CSSObject>;

export type ErrorPageDigitStyleToken = 'digits' | 'glyphs';
export type ErrorPageDigitStyleSheet = Record<ErrorPageDigitStyleToken, CSSObject>;

export type ErrorPageIllustrationStyleToken = 'layer' | 'tab' | 'curve' | 'diamond';
export type ErrorPageIllustrationStyleSheet = Record<ErrorPageIllustrationStyleToken, CSSObject>;

export type ErrorPageDotStyleToken = 'dot' | 'dotColumns' | 'dotRows';
export type ErrorPageDotStyleSheet = Record<ErrorPageDotStyleToken, CSSObject>;

export type ErrorPageActionStyleToken = 'row' | 'contained' | 'outlined';
export type ErrorPageActionStyleSheet = Record<ErrorPageActionStyleToken, CSSObject>;
