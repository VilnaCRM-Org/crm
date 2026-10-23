import { ReactComponent as WebhooksIcon } from '@/assets/icons/shell/dataflow-02.svg';
import { ReactComponent as IntegrationsIcon } from '@/assets/icons/shell/globe-02.svg';
import { ReactComponent as BoardsIcon } from '@/assets/icons/shell/layout-alt-01.svg';
import { ReactComponent as AnalyticsIcon } from '@/assets/icons/shell/line-chart-up-03.svg';
import { ReactComponent as ContactsIcon } from '@/assets/icons/shell/message-square-01.svg';
import { ReactComponent as ProductsIcon } from '@/assets/icons/shell/monitor-01.svg';
import { ReactComponent as BillingIcon } from '@/assets/icons/shell/receipt.svg';
import { ReactComponent as SettingsIcon } from '@/assets/icons/shell/settings-02.svg';
import { ReactComponent as OrdersIcon } from '@/assets/icons/shell/shopping-bag-01.svg';
import type { NavigationItemSet } from '@/components/types/ui-app-shell/navigation-item';
import ROUTE_PATHS from '@/routes/route-paths';

const navigationItems: NavigationItemSet = {
  items: [
    { id: 'boards', href: '/boards', labelKey: 'app_shell.items.boards', icon: BoardsIcon },
    { id: 'products', href: '/products', labelKey: 'app_shell.items.products', icon: ProductsIcon },
    { id: 'orders', href: '/orders', labelKey: 'app_shell.items.orders', icon: OrdersIcon },
    { id: 'contacts', href: '/contacts', labelKey: 'app_shell.items.contacts', icon: ContactsIcon },
    {
      id: 'analytics',
      href: '/analytics',
      labelKey: 'app_shell.items.analytics',
      icon: AnalyticsIcon,
    },
    {
      id: 'settings',
      href: ROUTE_PATHS.settings,
      labelKey: 'app_shell.items.settings',
      icon: SettingsIcon,
      flag: 'userSettings',
      children: {
        items: [
          {
            id: 'integrations',
            href: '/settings/integrations',
            labelKey: 'app_shell.items.integrations',
            icon: IntegrationsIcon,
            flag: 'userSettings',
          },
          {
            id: 'webhooks',
            href: '/settings/webhooks',
            labelKey: 'app_shell.items.webhooks',
            icon: WebhooksIcon,
            flag: 'userSettings',
          },
          {
            id: 'billing',
            href: '/settings/billing',
            labelKey: 'app_shell.items.billing',
            icon: BillingIcon,
            flag: 'userSettings',
          },
        ],
      },
    },
  ],
};

export default navigationItems;
