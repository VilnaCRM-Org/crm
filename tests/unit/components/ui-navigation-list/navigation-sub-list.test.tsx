import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';

import type { NavigationLeafSet } from '@/components/types/ui-app-shell/navigation-item';
import NavigationSubList from '@/components/ui-navigation-list/navigation-sub-list';
import renderShell from '@tests/unit/utils/render-shell';

const icon = 'svg' as unknown as NavigationLeafSet['items'][number]['icon'];

const leaves: NavigationLeafSet = {
  items: [
    {
      id: 'integrations',
      href: '/settings/integrations',
      labelKey: 'app_shell.items.integrations',
      icon,
    },
    { id: 'webhooks', href: '/settings/webhooks', labelKey: 'app_shell.items.webhooks', icon },
    { id: 'billing', href: '/settings/billing', labelKey: 'app_shell.items.billing', icon },
  ],
};

describe('NavigationSubList', () => {
  it('renders one nested list of three links, in order, under the given id', () => {
    renderShell(<NavigationSubList layout="desktop" id="sub" leaves={leaves} currentId={null} />);

    const list = screen.getByRole('list');
    const links = within(list).getAllByRole('link');

    expect(list).toHaveAttribute('id', 'sub');
    expect(list).toHaveAttribute('role', 'list');
    expect(links.map((link) => link.textContent)).toEqual(['Integrations', 'Webhooks', 'Billing']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/settings/integrations',
      '/settings/webhooks',
      '/settings/billing',
    ]);
  });

  it('marks only the current sub-item', () => {
    renderShell(
      <NavigationSubList layout="tablet" id="sub" leaves={leaves} currentId="webhooks" />
    );

    expect(screen.getByRole('link', { name: 'Webhooks' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Integrations' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Billing' })).not.toHaveAttribute('aria-current');
  });

  it('marks nothing when the current item is not a sub-item', () => {
    renderShell(<NavigationSubList layout="desktop" id="sub" leaves={leaves} currentId="boards" />);

    expect(screen.getAllByRole('link').filter((link) => link.hasAttribute('aria-current'))).toEqual(
      []
    );
  });

  it('reads in uk', () => {
    renderShell(<NavigationSubList layout="desktop" id="sub" leaves={leaves} currentId={null} />, {
      locale: 'uk',
    });

    expect(screen.getByRole('link', { name: 'Вебхуки' })).toBeInTheDocument();
  });
});
