import ROUTE_PATHS from '@/routes/route-paths';

export interface ComingSoonSection {
  readonly name: string;
  readonly path: string;
  readonly headingKey: string;
}

export const COMING_SOON_SECTIONS: readonly ComingSoonSection[] = [
  { name: 'boards', path: ROUTE_PATHS.boards, headingKey: 'coming_soon.sections.boards' },
  { name: 'products', path: ROUTE_PATHS.products, headingKey: 'coming_soon.sections.products' },
  { name: 'orders', path: ROUTE_PATHS.orders, headingKey: 'coming_soon.sections.orders' },
  { name: 'contacts', path: ROUTE_PATHS.contacts, headingKey: 'coming_soon.sections.contacts' },
  {
    name: 'analytics',
    path: ROUTE_PATHS.analytics,
    headingKey: 'coming_soon.sections.analytics',
  },
  {
    name: 'integrations',
    path: ROUTE_PATHS.settingsIntegrations,
    headingKey: 'coming_soon.sections.integrations',
  },
  {
    name: 'webhooks',
    path: ROUTE_PATHS.settingsWebhooks,
    headingKey: 'coming_soon.sections.webhooks',
  },
  {
    name: 'billing',
    path: ROUTE_PATHS.settingsBilling,
    headingKey: 'coming_soon.sections.billing',
  },
];
