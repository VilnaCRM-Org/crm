import type { FieldValues } from 'react-hook-form';

import loadIsolated from '@tests/unit/utils/isolated-module';

interface RootObservation {
  rootClasses: string[];
  plainClasses: string[];
  rootDeclarations: string;
  plainDeclarations: string;
}

const emotionClassOf = (classes: string[]): string =>
  classes.find((name) => name.startsWith('css-')) ?? '';

const declarationsOf = (className: string): string => {
  const rule = Array.from(document.styleSheets)
    .flatMap((sheet) => Array.from(sheet.cssRules))
    .find(
      (candidate) => candidate instanceof CSSStyleRule && candidate.selectorText === `.${className}`
    );
  const text = rule?.cssText ?? '';
  return text.slice(text.indexOf('{'));
};

const observeRoots = async (themedRoot: Record<string, string> = {}): Promise<RootObservation> =>
  loadIsolated(async () => {
    const React = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { useForm } = await import('react-hook-form');
    const { default: FormControl } = await import('@mui/material/FormControl');
    const { default: theme } = await import('@/components/ui-form-input-field/theme');
    const { default: UIFormInputField } = await import('@/components/ui-form-input-field');
    theme.components = {
      ...theme.components,
      MuiTextField: { styleOverrides: { root: themedRoot } },
    };

    const Harness = (): React.ReactElement => {
      const { control } = useForm<FieldValues>({ defaultValues: { email: '' } });
      return (
        <div>
          <UIFormInputField control={control} rules={{}} name="email" id="email" label="Email" />
          <FormControl className="plain" />
        </div>
      );
    };

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const mount = async (): Promise<void> => root.render(<Harness />);
    await React.act(mount);
    const classesAt = (selector: string): string[] =>
      Array.from(host.querySelector(selector)?.classList ?? []);
    const rootClasses = classesAt('.MuiTextField-root');
    const plainClasses = classesAt('.plain');
    const observation = {
      rootClasses,
      plainClasses,
      rootDeclarations: declarationsOf(emotionClassOf(rootClasses)),
      plainDeclarations: declarationsOf(emotionClassOf(plainClasses)),
    };
    const unmount = async (): Promise<void> => root.unmount();
    await React.act(unmount);
    host.remove();
    return observation;
  });

describe('UIFormInputField root element', () => {
  it('labels its emotion class with the MuiTextField root slot', async () => {
    const { rootClasses } = await observeRoots();

    expect(rootClasses).toEqual(
      expect.arrayContaining([
        'MuiFormControl-root',
        'MuiTextField-root',
        expect.stringMatching(/^css-[a-z0-9]+-MuiFormControl-root-MuiTextField-root$/),
      ])
    );
  });

  it('adds no declarations of its own to the FormControl styles', async () => {
    const { rootDeclarations, plainDeclarations } = await observeRoots();

    expect(plainDeclarations).toContain('display: inline-flex');
    expect(rootDeclarations).toBe(plainDeclarations);
  });

  it('applies the theme styleOverrides registered for the MuiTextField root slot', async () => {
    const { rootDeclarations } = await observeRoots({ minWidth: '13rem' });

    expect(rootDeclarations).toContain('min-width: 13rem');
  });
});
