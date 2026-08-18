import { render, screen } from '@testing-library/react';

import InertBox from '@auth/components/form-section/inert-box';

const BOX_ID = 'reg-form-1';

function getBox(): HTMLElement {
  return screen.getAllByRole('generic').find((element) => element.id === BOX_ID) as HTMLElement;
}

describe('InertBox inert transitions', () => {
  it('marks the container inert with the bare attribute value', () => {
    render(
      <InertBox id={BOX_ID} inert>
        <p>child</p>
      </InertBox>
    );

    expect(getBox()).toHaveAttribute('inert', '');
  });

  it('clears the inert attribute when the container becomes interactive again', () => {
    const { rerender } = render(
      <InertBox id={BOX_ID} inert>
        <p>child</p>
      </InertBox>
    );

    expect(getBox()).toHaveAttribute('inert');

    rerender(
      <InertBox id={BOX_ID} inert={false}>
        <p>child</p>
      </InertBox>
    );

    expect(getBox()).not.toHaveAttribute('inert');
  });

  it('re-applies the inert attribute when the container is disabled again', () => {
    const { rerender } = render(
      <InertBox id={BOX_ID} inert={false}>
        <p>child</p>
      </InertBox>
    );

    expect(getBox()).not.toHaveAttribute('inert');

    rerender(
      <InertBox id={BOX_ID} inert>
        <p>child</p>
      </InertBox>
    );

    expect(getBox()).toHaveAttribute('inert', '');
  });
});
