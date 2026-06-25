// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import InertBox from '@auth/components/form-section/inert-box';

function getBoxById(id: string): HTMLElement {
  return screen.getAllByRole('generic').find((element) => element.id === id) as HTMLElement;
}

describe('InertBox', () => {
  it('sets the inert attribute when inert is true', () => {
    render(
      <InertBox id="oauth-box" inert>
        <div>child</div>
      </InertBox>
    );

    expect(getBoxById('oauth-box')).toHaveAttribute('inert');
  });

  it('does not set the inert attribute when inert is false', () => {
    render(
      <InertBox id="oauth-box" inert={false}>
        <div>child</div>
      </InertBox>
    );

    expect(getBoxById('oauth-box')).not.toHaveAttribute('inert');
  });

  it('detaches the ref without error on unmount', () => {
    const view = render(
      <InertBox id="oauth-box" inert>
        <div>child</div>
      </InertBox>
    );

    expect(() => view.unmount()).not.toThrow();
  });
});
