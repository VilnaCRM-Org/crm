import '@testing-library/jest-dom';
import { waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

import CurrentMenu from '@/modules/user/features/settings/components/user-menu/current-user-menu';
import currentUserSource from '@/modules/user/features/settings/utils/current-user-source';
import renderShell from '@tests/unit/utils/render-shell';
import { inertSession } from '@tests/unit/utils/session-outlet';

const mockRead = jest.fn();

const READ_USER = {
  kind: 'ok',
  identity: { displayName: 'Олена Петренко', monogram: 'ОП' },
};

const renderMenu = (ui: ReactElement): ReturnType<typeof renderShell> =>
  renderShell(ui, { session: inertSession });

describe('CurrentMenu', () => {
  beforeEach(() => {
    mockRead.mockReset();
    jest
      .spyOn(currentUserSource, 'read')
      .mockImplementation((_session, signal) => mockRead(signal));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders nothing and reports no identity while the read is pending', async () => {
    mockRead.mockReturnValue(new Promise(() => undefined));
    const onIdentity = jest.fn();
    const { container } = renderMenu(<CurrentMenu onIdentity={onIdentity} />);

    await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(1));

    expect(container).toBeEmptyDOMElement();
    expect(onIdentity.mock.calls).toEqual([[null]]);
  });

  it('reports the read identity once it arrives, reading once', async () => {
    mockRead.mockResolvedValue(READ_USER);
    const onIdentity = jest.fn();
    renderMenu(<CurrentMenu onIdentity={onIdentity} />);

    await waitFor(() =>
      expect(onIdentity).toHaveBeenLastCalledWith({
        displayName: 'Олена Петренко',
        monogram: 'ОП',
      })
    );
    expect(mockRead).toHaveBeenCalledTimes(1);
  });

  it('keeps reporting no identity when the read fails', async () => {
    mockRead.mockResolvedValue({ kind: 'failed', reason: 'unavailable' });
    const onIdentity = jest.fn();
    renderMenu(<CurrentMenu onIdentity={onIdentity} />);

    await waitFor(() => expect(mockRead).toHaveBeenCalled());

    expect(onIdentity).not.toHaveBeenCalledWith(expect.objectContaining({ monogram: 'ОП' }));
    expect(onIdentity).toHaveBeenLastCalledWith(null);
  });
});
