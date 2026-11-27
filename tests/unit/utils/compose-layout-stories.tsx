import type { Decorator, Meta, StoryObj } from '@storybook/react-webpack5';
import type { ComponentType, JSX } from 'react';

import type { ShellLayout } from '@/components/types/ui-app-shell';

interface LayoutStageArgs {
  readonly layout: ShellLayout;
}

type LayoutStageMeta = Meta<ComponentType<LayoutStageArgs>>;

type LayoutStageStory = StoryObj<ComponentType<LayoutStageArgs>>;

export interface LayoutStoriesModule {
  readonly [name: string]: LayoutStageStory | LayoutStageMeta;
  readonly default: LayoutStageMeta;
}

export type StoryRender = () => JSX.Element;

const storyContext = {} as Parameters<Decorator<LayoutStageArgs>>[1];

const decorate = (meta: LayoutStageMeta, story: LayoutStageStory): StoryRender => {
  const Stage = meta.component;
  if (Stage === undefined) throw new Error('the stories declare no component');
  const args: LayoutStageArgs = { layout: 'desktop', ...meta.args, ...story.args };
  const decorators = [story.decorators ?? [], meta.decorators ?? []].flat();

  return decorators.reduce<StoryRender>(
    (Inner, decorator) =>
      function Decorated(): JSX.Element {
        return decorator(Inner, storyContext) as JSX.Element;
      },
    function Undecorated(): JSX.Element {
      return <Stage layout={args.layout} />;
    }
  );
};

const composeLayoutStories = ({
  default: meta,
  ...stories
}: LayoutStoriesModule): Record<string, StoryRender> =>
  Object.fromEntries(
    Object.entries(stories).map(([name, story]) => [
      name,
      decorate(meta, story as LayoutStageStory),
    ])
  );

export default composeLayoutStories;
