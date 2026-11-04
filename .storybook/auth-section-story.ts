import type { Decorator, Parameters } from '@storybook/react-webpack5';

import { withMemoryRouter } from './router-decorators';

interface AuthSectionMeta {
  decorators: Decorator[];
  parameters: Parameters;
}

class AuthSectionStories {
  public meta(initialPath: string, description: string): AuthSectionMeta {
    return {
      decorators: [withMemoryRouter(initialPath)],
      parameters: {
        docs: {
          description: { component: description },
          story: { inline: false },
        },
      },
    };
  }
}

const authSectionStories = new AuthSectionStories();

export default authSectionStories;
