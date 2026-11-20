import waitForText from '@stories/wait-for-text';

describe('waitForText', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('resolves at once when the text is already rendered', async () => {
    const root = document.createElement('div');
    root.textContent = 'Не вдалося скопіювати';
    document.body.append(root);

    await expect(waitForText(root, 'скопіювати')).resolves.toBeUndefined();
  });

  it('resolves once a later render adds the text', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    let settled = false;
    const waiting = waitForText(root, 'вручну').then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);
    const line = document.createElement('p');
    line.textContent = 'Скопіюйте вручну.';
    root.append(line);

    await waiting;
    expect(settled).toBe(true);
  });
});
