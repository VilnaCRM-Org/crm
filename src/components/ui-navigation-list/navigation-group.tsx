import Box from '@mui/material/Box';
import { type JSX, useId } from 'react';
import { useTranslation } from 'react-i18next';

import type { NavigationGroupProps } from '@/components/types/ui-navigation-list';

import groupStyles from './group-styles';
import NavigationGroupToggle from './navigation-group-toggle';
import NavigationRow from './navigation-row';
import NavigationSubList from './navigation-sub-list';
import useGroupDisclosure from './use-group-disclosure';

export default function NavigationGroup({
  layout,
  group,
  currentId,
}: NavigationGroupProps): JSX.Element {
  const { t } = useTranslation();
  const { expanded, toggle } = useGroupDisclosure(group.href);
  const listId = useId();

  return (
    <Box component="li" sx={groupStyles.group[expanded ? 'expanded' : 'collapsed'][layout]}>
      <NavigationRow
        layout={layout}
        variant="item"
        id={group.id}
        label={t(group.labelKey)}
        icon={group.icon}
        href={group.href}
        current={currentId === group.id}
        open={expanded}
      />
      <NavigationGroupToggle
        layout={layout}
        expanded={expanded}
        controls={listId}
        onToggle={toggle}
      />
      {expanded && (
        <NavigationSubList
          layout={layout}
          id={listId}
          leaves={group.children}
          currentId={currentId}
        />
      )}
    </Box>
  );
}
