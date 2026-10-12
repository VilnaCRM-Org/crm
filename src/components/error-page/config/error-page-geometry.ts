import type {
  ErrorPageCardSurfaceGeometry,
  ErrorPageDigitGeometry,
  ErrorPageGeometryTable,
  ErrorPagePageGeometry,
} from '@/components/types/error-page';

const LARGE_PAGE: ErrorPagePageGeometry = {
  paddingTop: 76,
  paddingBottom: 121,
};

const LARGE_DIGITS: ErrorPageDigitGeometry = {
  width: 466,
  height: 330,
  fontSize: 244.5,
  lineHeight: 293.4,
  shadowOffset: 4,
  glyphs: [
    { x: 0, y: 0 },
    { x: 147, y: 36 },
    { x: 301, y: 0 },
  ],
};

const LARGE_CARD_SURFACE: ErrorPageCardSurfaceGeometry = {
  border: 1,
  radius: 16,
  shadowY: 4,
  shadowBlur: 31,
  textInset: 24,
  descInset: 24,
  titleSize: 36,
  titleWeight: 600,
};

const DESKTOP: ErrorPageGeometryTable['desktop'] = {
  page: LARGE_PAGE,
  composition: { width: 614 },
  digits: LARGE_DIGITS,
  card: {
    ...LARGE_CARD_SURFACE,
    width: 614,
    top: 29,
    titleLine: 43,
    gapTitle: 6,
    descSize: 16,
    descLine: 26,
    gapActions: 24,
    actionsHeight: 62,
    bottom: 32,
  },
  button: { height: 62, paddingX: 32, labelSize: 18, labelLine: 22, labelWeight: 600 },
  tab: { left: 37, right: 37, y: 301, height: 225, radius: 32 },
  curve: { x: -56, y: 36, width: 643, height: 357 },
  diamond: { x: 44, y: 54, width: 40, height: 40 },
  dot: { x: 574.921, y: 99.928, width: 10.338, height: 10.354 },
  dotColumns: { x: -80, y: 376, width: 59.09, height: 161.541 },
  dotRows: null,
};

const ERROR_PAGE_GEOMETRY: ErrorPageGeometryTable = {
  desktop: DESKTOP,
  tablet: {
    ...DESKTOP,
    composition: { width: 474 },
    card: {
      ...DESKTOP.card,
      width: 474,
      top: 24,
      gapTitle: 4,
      descSize: 18,
      descLine: 30,
      actionsHeight: 70,
      bottom: 40,
    },
    button: { ...DESKTOP.button, height: 70, paddingX: 44 },
    tab: { ...DESKTOP.tab, left: 26, right: 27 },
    curve: { ...DESKTOP.curve, x: -84.303, width: 654.86 },
    diamond: { ...DESKTOP.diamond, x: 17.541, width: 40.738 },
    dot: { x: 558.255, y: 99.928, width: 10.529, height: 10.354 },
    dotColumns: { x: -79.211, y: 376, width: 60.181, height: 161.541 },
    dotRows: null,
  },
  mobile: {
    page: { paddingTop: 43.61, paddingBottom: 73.91 },
    composition: { width: 350.348 },
    digits: {
      width: 344.435,
      height: 243.913,
      fontSize: 154.462,
      lineHeight: 185.355,
      shadowOffset: 2.527,
      glyphs: [
        { x: 27.739, y: 14.582 },
        { x: 120.606, y: 37.324 },
        { x: 217.896, y: 14.582 },
      ],
    },
    card: {
      border: 0.739,
      radius: 11.826,
      shadowY: 2.957,
      shadowBlur: 22.913,
      textInset: 16,
      descInset: 43.695,
      titleSize: 22,
      titleWeight: 700,
      width: 350.348,
      top: 26.476,
      titleLine: 26,
      gapTitle: 3.74,
      descSize: 15,
      descLine: 25,
      gapActions: 16,
      actionsHeight: 50,
      bottom: 26.48,
    },
    button: { height: 50, paddingX: 24, labelSize: 15, labelLine: 18, labelWeight: 500 },
    tab: { left: 19.216, right: 19.958, y: 222.478, height: 166.304, radius: 23.652 },
    curve: { x: 2.695, y: 58.388, width: 360, height: 200 },
    diamond: { x: 10.346, y: 39.912, width: 29.565, height: 29.565 },
    dot: null,
    dotColumns: null,
    dotRows: { width: 161.541, height: 59.091, gapBelowCard: 19.779 },
  },
};

export default ERROR_PAGE_GEOMETRY;
