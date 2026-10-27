import 'reflect-metadata';
import '@testing-library/jest-dom';
import { waitFor } from '@testing-library/react';

import CurrentMenu from '@/modules/user/features/settings/components/user-menu/current-user-menu';
import renderShell from '@tests/unit/utils/render-shell';

const mockRead = jest.fn();

jest.mock('@/providers/di', () => {
  const Mapper = jest.requireActual('@/modules/user/store/user-display-name-mapper').default;
  const tokens = jest.requireActual('@/modules/user/config/tokens').default;
  const mapper = new Mapper();
  const provider = { read: (signal: AbortSignal): unknown => mockRead(signal) };

  return {
    __esModule: true,
    useService: (token: symbol): unknown => (token === tokens.ProfileProvider ? provider : mapper),
  };
});

const READ_USER = {
  kind: 'ok',
  user: { id: 'u', fullName: 'Петренко Олена Іванівна', email: 'o@example.com', confirmed: true },
};

describe('CurrentMenu', () => {
  beforeEach(() => {
    mockRead.mockReset();
  });

  it('renders nothing and reports no identity while the read is pending', async () => {
    mockRead.mockReturnValue(new Promise(() => undefined));
    const onIdentity = jest.fn();
    const { container } = renderShell(<CurrentMenu onIdentity={onIdentity} />);

    await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(1));

    expect(container).toBeEmptyDOMElement();
    expect(onIdentity.mock.calls).toEqual([[null]]);
  });

  it('reports the read identity once it arrives, reading once', async () => {
    mockRead.mockResolvedValue(READ_USER);
    const onIdentity = jest.fn();
    renderShell(<CurrentMenu onIdentity={onIdentity} />);

    await waitFor(() =>
      expect(onIdentity).toHaveBeenLastCalledWith({
        displayName: 'Олена Петренко',
        monogram: 'ОП',
      })
    );
    expect(mockRead).toHaveBeenCalledTimes(1);
  });

  it('keeps reporting no identity when the read fails', async () => {
    mockRead.mockResolvedValue({ kind: 'failed', reason: 'transient' });
    const onIdentity = jest.fn();
    renderShell(<CurrentMenu onIdentity={onIdentity} />);

    await waitFor(() => expect(mockRead).toHaveBeenCalled());

    expect(onIdentity).not.toHaveBeenCalledWith(expect.objectContaining({ monogram: 'ОП' }));
    expect(onIdentity).toHaveBeenLastCalledWith(null);
  });
});
