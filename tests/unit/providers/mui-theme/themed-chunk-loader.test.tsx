import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { FallbackLandmark } from '@/components/types/error-boundary';
import type { ComponentModule, MuiThemeShellModule } from '@/components/types/providers';
import type { ModuleLoader } from '@/lib/reliability/types/module-loader';
import ThemedChunkLoader from '@/providers/mui-theme/themed-chunk-loader';
import { buildToken } from '@tests/builders';

type ForwardedProps = { variant: string; landmark: FallbackLandmark };

const contentModule = (text: string): ComponentModule => ({
  default: (): ReactNode => <p>{text}</p>,
});

const shellModule = (label: string): MuiThemeShellModule => ({
  default: ({ children }): ReactNode => <section aria-label={label}>{children}</section>,
});

const resolving = <TModule,>(loaded: TModule): ModuleLoader<TModule> => ({
  load: (): Promise<TModule> => Promise.resolve(loaded),
});

const rejecting = <TModule,>(failure: Error): ModuleLoader<TModule> => ({
  load: (): Promise<TModule> => Promise.reject(failure),
});

describe('ThemedChunkLoader', () => {
  it('renders the loaded content inside the loaded theme shell', async () => {
    const text = buildToken();
    const label = buildToken();
    const loader = new ThemedChunkLoader(
      resolving(contentModule(text)),
      resolving(shellModule(label))
    );

    const { default: Themed } = await loader.load();
    render(<Themed />);

    expect(screen.getByRole('region', { name: label })).toContainElement(screen.getByText(text));
  });

  it('forwards the rendered props to the content inside the theme shell', async () => {
    const label = buildToken();
    const variant = buildToken();
    const landmark: FallbackLandmark = 'region';
    const content: ComponentModule<ForwardedProps> = {
      default: ({ variant: shown, landmark: role }): ReactNode => <p>{`${shown}:${role}`}</p>,
    };
    const loader = new ThemedChunkLoader<ForwardedProps>(
      resolving(content),
      resolving(shellModule(label))
    );

    const { default: Themed } = await loader.load();
    render(<Themed variant={variant} landmark={landmark} />);

    expect(screen.getByRole('region', { name: label })).toContainElement(
      screen.getByText(`${variant}:${landmark}`)
    );
  });

  it('requests the content and the shell together rather than one after the other', () => {
    const content = jest.fn(() => new Promise<ComponentModule>(() => undefined));
    const shell = jest.fn(() => new Promise<MuiThemeShellModule>(() => undefined));

    void new ThemedChunkLoader({ load: content }, { load: shell }).load();

    expect(content).toHaveBeenCalledTimes(1);
    expect(shell).toHaveBeenCalledTimes(1);
  });

  it('rejects with the content failure', async () => {
    const failure = new Error(buildToken());
    const loader = new ThemedChunkLoader(
      rejecting<ComponentModule>(failure),
      resolving(shellModule(buildToken()))
    );

    await expect(loader.load()).rejects.toBe(failure);
  });

  it('rejects with the shell failure', async () => {
    const failure = new Error(buildToken());
    const loader = new ThemedChunkLoader(
      resolving(contentModule(buildToken())),
      rejecting<MuiThemeShellModule>(failure)
    );

    await expect(loader.load()).rejects.toBe(failure);
  });
});
