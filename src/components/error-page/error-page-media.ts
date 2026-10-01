import type { ErrorPageMediaQueries } from '@/components/types/error-page';
import breakpointsTheme from '@/components/ui-breakpoints';

const { lg } = breakpointsTheme.breakpoints.values;

const ERROR_PAGE_MEDIA: ErrorPageMediaQueries = {
  tablet: `@media (max-width: ${lg}px)`,
  mobile: breakpointsTheme.breakpoints.down('md'),
};

export default ERROR_PAGE_MEDIA;
