import type { Decorator } from '@storybook/react-webpack5';
import type { JSX } from 'react';

import { withMemoryRouter } from './router-decorators';

export function withStoryList(width: number): Decorator {
  return function StoryListDecorator(Story): JSX.Element {
    return (
      <ol role="list" style={{ width, margin: 24, padding: 0, listStyle: 'none' }}>
        <Story />
      </ol>
    );
  };
}

export function withRoutedStoryList(initialPath: string, width: number): Decorator[] {
  return [withMemoryRouter(initialPath), withStoryList(width)];
}
