import type { CSSObject } from '@emotion/react';

import type { FallbackLandmark } from '@/components/types/error-boundary';
import type { ComponentModule } from '@/components/types/providers';

export type ErrorPageVariantId = 'notFound' | 'forbidden' | 'serverError';
export type ErrorPageHomeAppearance = 'contained' | 'outlined';

export interface ErrorPageCardRhythm {
  gapTitle: number;
  gapActions: number;
  bottom: number;
}

export interface ErrorPageGlyphs {
  first: string;
  second: string;
  third: string;
}

export interface ErrorPageVariant {
  glyphs: ErrorPageGlyphs;
  digitColor: string;
  digitShadowColor: string;
  titleKey: string;
  descriptionKey: string;
  codeKey: string;
  homeAppearance: ErrorPageHomeAppearance;
  requestAccess: boolean;
  mobileCard: ErrorPageCardRhythm;
}

export interface ErrorPageProps {
  variant: ErrorPageVariantId;
  landmark: FallbackLandmark;
}

export type ErrorPageVariantProps = Pick<ErrorPageProps, 'variant'>;

export type ErrorPageModule = ComponentModule<ErrorPageProps>;

export interface ErrorPagePageGeometry {
  paddingTop: number;
  paddingBottom: number;
}

export interface ErrorPageCompositionGeometry {
  width: number;
}

export interface ErrorPageGlyphPosition {
  x: number;
  y: number;
}

export interface ErrorPageGlyphPositions {
  first: ErrorPageGlyphPosition;
  second: ErrorPageGlyphPosition;
  third: ErrorPageGlyphPosition;
}

export interface ErrorPageDigitGeometry {
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
  shadowOffset: number;
  glyphs: ErrorPageGlyphPositions;
}

export interface ErrorPageCardSurfaceGeometry {
  border: number;
  radius: number;
  shadowY: number;
  shadowBlur: number;
  textInset: number;
  descInset: number;
  titleSize: number;
  titleWeight: number;
}

export interface ErrorPageCardGeometry extends ErrorPageCardSurfaceGeometry {
  width: number;
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

export interface ErrorPageGeometryTable {
  desktop: ErrorPageGeometry;
  tablet: ErrorPageGeometry;
  mobile: ErrorPageGeometry;
}

export interface ErrorPageMediaQueries {
  tablet: string;
  mobile: string;
}

export interface ErrorPageStyleSheet {
  landmark: CSSObject;
  composition: CSSObject;
}

export interface ErrorPageCardStyleSheet {
  card: CSSObject;
  title: CSSObject;
  description: CSSObject;
  statusCode: CSSObject;
}

export interface ErrorPageCardRhythmSheet {
  card: CSSObject;
  description: CSSObject;
}

export interface ErrorPageDigitStyleSheet {
  digits: CSSObject;
  glyphs: CSSObject;
}

export interface ErrorPageIllustrationStyleSheet {
  layer: CSSObject;
  tab: CSSObject;
  curve: CSSObject;
  diamond: CSSObject;
}

export interface ErrorPageDotStyleSheet {
  dot: CSSObject;
  dotColumns: CSSObject;
  dotRows: CSSObject;
}

export interface ErrorPageActionStyleSheet {
  row: CSSObject;
  contained: CSSObject;
  outlined: CSSObject;
  stacked: CSSObject;
}
