import type { Decorator, Meta } from '@storybook/react-webpack5';

interface StoryMetaOptions {
  title: string;
  component: NonNullable<Meta['component']>;
  description: string;
  decorators?: Decorator[];
}

export default function createStoryMeta({
  title,
  component,
  description,
  decorators = [],
}: StoryMetaOptions): Meta {
  return {
    title,
    component,
    tags: ['autodocs'],
    decorators,
    parameters: { docs: { description: { component: description } } },
  };
}
