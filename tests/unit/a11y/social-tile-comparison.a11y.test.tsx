import type { Meta, StoryObj } from '@storybook/react-webpack5';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import { createElement } from 'react';
import type { ComponentType, JSX } from 'react';
import { I18nextProvider } from 'react-i18next';

import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

interface ViewportOption {
  readonly styles: { readonly width: string };
}

interface ComparisonParameters {
  readonly viewport: { readonly options: Readonly<Record<string, ViewportOption>> };
  readonly docs: { readonly story: { readonly inline: boolean } };
}

type ComparisonStory = StoryObj<ComponentType>;

type ComparisonContext = Parameters<NonNullable<ComparisonStory['render']>>[1];

type StoryRender = () => JSX.Element;

interface ComparisonStoriesModule {
  readonly [name: string]: ComparisonStory | Meta<ComponentType>;
  readonly default: Meta<ComponentType> & { readonly parameters: ComparisonParameters };
}

const { default: meta, ...stories }: ComparisonStoriesModule = jest.requireActual(
  '@/modules/user/features/settings/components/social-networks/social-networks-comparison.stories'
);

const STORY_WIDTHS: ReadonlyArray<[string, string]> = [
  ['Phone375', '375px'],
  ['Tablet768', '768px'],
  ['Desktop1025', '1025px'],
  ['Desktop1100', '1100px'],
  ['Desktop1440', '1440px'],
];

const i18n = createSettingsLocaleI18n('uk', []);

const storyContext = {} as ComparisonContext;

const composeStory = (story: ComparisonStory): StoryRender => {
  const Stage = meta.component;
  if (Stage === undefined) throw new Error('the comparison stories declare no component');
  const args = { ...meta.args, ...story.args };
  const renderArgs = story.render ?? meta.render;
  const decorators = [story.decorators ?? [], meta.decorators ?? []].flat();

  return decorators.reduce<StoryRender>(
    (Inner, decorator) =>
      function Decorated(): JSX.Element {
        return decorator(Inner, storyContext) as JSX.Element;
      },
    function Undecorated(): JSX.Element {
      return renderArgs === undefined
        ? createElement(Stage, args)
        : (renderArgs(args, storyContext) as JSX.Element);
    }
  );
};

const composed: ReadonlyArray<[string, StoryRender]> = Object.entries(stories).map(
  ([name, story]) => [name, composeStory(story as ComparisonStory)]
);

const renderStory = (Story: StoryRender): ReturnType<typeof render> =>
  render(
    <I18nextProvider i18n={i18n}>
      <Story />
    </I18nextProvider>
  );

const viewportWidth = (name: string): string | undefined => {
  const story = stories[name] as ComparisonStory;
  const value: unknown = story.globals?.['viewport']?.value;

  return meta.parameters.viewport.options[String(value)]?.styles.width;
};

describe('Settings/SocialNetworks/Comparison stories', () => {
  it('ships one story per compared width', () => {
    expect(meta.title).toBe('Settings/SocialNetworks/Comparison');
    expect(Object.keys(stories)).toEqual(STORY_WIDTHS.map(([name]) => name));
    expect(composed.map(([name]) => name)).toEqual(STORY_WIDTHS.map(([name]) => name));
  });

  it.each(STORY_WIDTHS)('opens %s at a %s viewport', (name, width) => {
    expect(viewportWidth(name)).toBe(width);
  });

  it('renders each story in its own frame on the docs page', () => {
    expect(meta.parameters.docs.story.inline).toBe(false);
  });

  it('stacks the three styles, each idle and busy, with Google and GitHub linked', () => {
    renderStory(composeStory(stories['Phone375'] as ComparisonStory));
    const cards = screen.getAllByRole('list', { name: 'Соціальні мережі' });

    expect(cards).toHaveLength(6);
    cards.forEach((list) => {
      expect(within(list).getByRole('button', { name: 'Відключити Google' })).toBeInTheDocument();
      expect(within(list).getByRole('button', { name: 'Відключити GitHub' })).toBeInTheDocument();
    });
    expect(
      cards.map((list) =>
        within(list)
          .getByRole('button', { name: 'Відключити Google' })
          .getAttribute('aria-disabled')
      )
    ).toEqual(['false', 'true', 'false', 'true', 'false', 'true']);
    expect(screen.getAllByRole('img', { name: 'Підключено', hidden: true })).toHaveLength(4);
  });

  it.each(composed)(
    'renders the %s story with no axe violations (jsdom applies no viewport width)',
    async (_name, Story) => {
      const { container } = renderStory(Story);

      await expectNoA11yViolations(container);
    }
  );
});
