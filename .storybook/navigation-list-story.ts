import type { ArgTypes, Parameters, StoryObj } from '@storybook/react-webpack5';

class NavigationListStories {
  public readonly layoutArgTypes: ArgTypes = {
    layout: { control: 'select', options: ['desktop', 'tablet'] },
  };

  public readonly layoutAndVariantArgTypes: ArgTypes = {
    ...this.layoutArgTypes,
    variant: { control: 'select', options: ['expanded', 'rail'] },
  };

  public readonly desktop: StoryObj = {};

  public readonly tablet: StoryObj = { args: { layout: 'tablet' } };

  public readonly rail: StoryObj = { args: { variant: 'rail' } };

  public readonly tabletRail: StoryObj = { args: { layout: 'tablet', variant: 'rail' } };

  public parameters(component: string): Parameters {
    return { docs: { description: { component }, story: { inline: false } } };
  }
}

const navigationListStories = new NavigationListStories();

export default navigationListStories;
