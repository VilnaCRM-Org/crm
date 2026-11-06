import type { ComingSoonSectionSet } from '@/components/types/coming-soon';
import ROUTE_PATHS from '@/routes/route-paths';

const comingSoonSections: ComingSoonSectionSet = {
  items: [
    { path: ROUTE_PATHS.boards, headingKey: 'coming_soon.sections.boards' },
    { path: ROUTE_PATHS.products, headingKey: 'coming_soon.sections.products' },
    { path: ROUTE_PATHS.orders, headingKey: 'coming_soon.sections.orders' },
    { path: ROUTE_PATHS.contacts, headingKey: 'coming_soon.sections.contacts' },
    { path: ROUTE_PATHS.analytics, headingKey: 'coming_soon.sections.analytics' },
    { path: ROUTE_PATHS.settingsIntegrations, headingKey: 'coming_soon.sections.integrations' },
    { path: ROUTE_PATHS.settingsWebhooks, headingKey: 'coming_soon.sections.webhooks' },
    { path: ROUTE_PATHS.settingsBilling, headingKey: 'coming_soon.sections.billing' },
  ],
};

export default comingSoonSections;
