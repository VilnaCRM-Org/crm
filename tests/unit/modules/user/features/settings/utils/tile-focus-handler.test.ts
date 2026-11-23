import TileFocusHandler from '@/modules/user/features/settings/utils/tile-focus-handler';

const addButton = (): HTMLButtonElement => {
  const button = document.createElement('button');
  document.body.append(button);
  return button;
};

describe('TileFocusHandler', () => {
  afterEach(() => document.body.replaceChildren());

  it('hands the focus of a replaced control to its successor, once', () => {
    const handler = new TileFocusHandler();
    const first = addButton();
    const detach = handler.attach(first);
    first.focus();

    detach();
    first.remove();
    const second = addButton();
    handler.attach(second);
    handler.restore();
    expect(second).toHaveFocus();
    expect(handler.controlRef.current).toBe(second);

    second.blur();
    handler.restore();
    expect(document.body).toHaveFocus();
  });

  it('takes no focus the replaced control did not hold', () => {
    const handler = new TileFocusHandler();
    const detach = handler.attach(addButton());
    const elsewhere = addButton();
    elsewhere.focus();

    detach();
    handler.attach(addButton());
    handler.restore();

    expect(elsewhere).toHaveFocus();
  });

  it('restores nothing when no control is attached', () => {
    const handler = new TileFocusHandler();
    handler.attach(document.body as HTMLButtonElement)();
    handler.attach(null);

    expect(() => handler.restore()).not.toThrow();
  });
});
