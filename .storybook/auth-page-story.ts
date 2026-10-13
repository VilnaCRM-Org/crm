import type { Decorator, Parameters, StoryObj } from '@storybook/react-webpack5';
import type { ComponentType } from 'react';

import { withMemoryRouter } from './router-decorators';

interface AuthPageMeta<TComponent extends ComponentType<never>> {
  component: TComponent;
  decorators: Decorator[];
  parameters: Parameters;
}

class AuthPageStories {
  public readonly default: StoryObj = {};

  public meta<TComponent extends ComponentType<never>>(
    component: TComponent,
    initialPath: string,
    description: string
  ): AuthPageMeta<TComponent> {
    return {
      component,
      decorators: this.decorators(initialPath),
      parameters: this.parameters(description),
    };
  }

  private decorators(initialPath: string): Decorator[] {
    return [withMemoryRouter(initialPath)];
  }

  private parameters(description: string): Parameters {
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
