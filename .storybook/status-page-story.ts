import type { Parameters, StoryObj } from '@storybook/react-webpack5';

class StatusPageStories {
  public readonly desktop: StoryObj = {};

  public readonly mobile: StoryObj = {
    globals: { viewport: { value: 'xs', isRotated: false } },
  };

  public parameters(route: string, status: string): Parameters {
    return {
      docs: {
        description: {
          component:
            `${route} (issue #309): the designed ${status} error page in a \`<main>\` ` +
            'landmark with the footer. It also sets the document title.',
        },
        story: { inline: false },
      },
      layout: 'fullscreen',
    };
  }
}

const statusPageStories = new StatusPageStories();

export default statusPageStories;
