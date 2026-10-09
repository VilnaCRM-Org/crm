import type { ErrorPageVariant, ErrorPageVariantId } from '@/components/types/error-page';
import { customColors, paletteColors } from '@/styles/colors';

export const ERROR_PAGE_TITLE_ID = 'error-page-title';
export const ERROR_PAGE_ACTIONS_ID = 'error-page-actions';
export const ERROR_PAGE_DIGITS_ID = 'error-page-digits';

const ERROR_PAGE_VARIANTS = {
  notFound: {
    glyphs: ['4', '0', '4'],
    digitColor: paletteColors.primary.main,
    digitShadowColor: customColors.digitShadow.primary,
    titleKey: 'error_page.not_found.title',
    descriptionKey: 'error_page.not_found.description',
    codeKey: 'error_page.not_found.code',
    homeAppearance: 'contained',
    requestAccess: false,
    mobileCard: { gapTitle: 3.74, gapActions: 16, bottom: 26.48 },
  },
  forbidden: {
    glyphs: ['4', '0', '3'],
    digitColor: customColors.brand.darkPrimary,
    digitShadowColor: customColors.digitShadow.dark,
    titleKey: 'error_page.forbidden.title',
    descriptionKey: 'error_page.forbidden.description',
    codeKey: 'error_page.forbidden.code',
    homeAppearance: 'outlined',
    requestAccess: true,
    mobileCard: { gapTitle: 8, gapActions: 16, bottom: 24 },
  },
  serverError: {
    glyphs: ['5', 'x', 'x'],
    digitColor: paletteColors.secondary.main,
    digitShadowColor: customColors.digitShadow.secondary,
    titleKey: 'error_page.server_error.title',
    descriptionKey: 'error_page.server_error.description',
    codeKey: 'error_page.server_error.code',
    homeAppearance: 'contained',
    requestAccess: false,
    mobileCard: { gapTitle: 8, gapActions: 8, bottom: 20 },
  },
} as const satisfies Record<ErrorPageVariantId, ErrorPageVariant>;

export default ERROR_PAGE_VARIANTS;
