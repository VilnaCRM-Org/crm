import type ROUTE_PATHS_TYPE from '@/routes/route-paths';
import loadIsolated from '@tests/unit/utils/isolated-module';

type SectionSet = (typeof import('@/components/coming-soon/coming-soon-sections'))['default'];

interface Loaded {
  readonly sections: SectionSet;
  readonly paths: typeof ROUTE_PATHS_TYPE;
}

const load = (): Promise<Loaded> =>
  loadIsolated(async () => ({
    sections: (await import('@/components/coming-soon/coming-soon-sections')).default,
    paths: (await import('@/routes/route-paths')).default,
  }));

describe('coming-soon sections', () => {
  it('lists the eight planned sections in navigation order, keyed by path', async () => {
    const { sections, paths } = await load();

    expect(sections.items.map(({ path }) => path)).toEqual([
      paths.boards,
      paths.products,
      paths.orders,
      paths.contacts,
      paths.analytics,
      paths.settingsIntegrations,
      paths.settingsWebhooks,
      paths.settingsBilling,
    ]);
  });

  it('gives every section its own heading key in the coming-soon catalog namespace', async () => {
    const { sections } = await load();

    expect(sections.items.map(({ headingKey }) => headingKey)).toEqual([
      'coming_soon.sections.boards',
      'coming_soon.sections.products',
      'coming_soon.sections.orders',
      'coming_soon.sections.contacts',
      'coming_soon.sections.analytics',
      'coming_soon.sections.integrations',
      'coming_soon.sections.webhooks',
      'coming_soon.sections.billing',
    ]);
  });
});
