import type { Decorator, Parameters, StoryObj } from '@storybook/react-webpack5';

import { withMemoryRouter } from './router-decorators';

class AuthPageStories {
  public readonly default: StoryObj = {};

  public decorators(initialPath: string): Decorator[] {
    return [withMemoryRouter(initialPath)];
  }

  public parameters(description: string): Parameters {
    return {
      docs: {
        description: { component: description },
        story: { inline: false },
      },
      layout: 'fullscreen',
    };
  }
}

const authPageStories = new AuthPageStories();

export default authPageStories;
