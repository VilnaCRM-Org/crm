import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { useForm } from 'react-hook-form';
import { I18nextProvider } from 'react-i18next';

import type {
  PasswordRuleEvaluator,
  PasswordRuleViewSet,
} from '@/components/types/ui-password-policy-rules';
import FormProviderBridge from '@/components/ui-form/form-provider-bridge';
import UIFormField from '@/components/ui-form-field';
import UIPasswordPolicyRules from '@/components/ui-password-policy-rules';
import passwordValidator from '@/modules/user/lib/validations/password';
import createRecoveryLocaleI18n from '@tests/unit/utils/create-recovery-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

interface Values {
  password: string;
}

const i18n = createRecoveryLocaleI18n('uk');
const RULES_ID = 'rules-id';

const evaluatePassword = (value: string): PasswordRuleViewSet => passwordValidator.evaluate(value);

function Harness({
  evaluate = evaluatePassword,
}: {
  evaluate?: PasswordRuleEvaluator;
}): JSX.Element {
  const methods = useForm<Values>({ defaultValues: { password: '' } });
  return (
    <I18nextProvider i18n={i18n}>
      <FormProviderBridge methods={methods}>
        <UIFormField<Values>
          name="password"
          label="Пароль"
          placeholder="Пароль"
          type="text"
          autoComplete="off"
          rules={{}}
        />
        <UIPasswordPolicyRules id={RULES_ID} name="password" evaluate={evaluate} />
      </FormProviderBridge>
    </I18nextProvider>
  );
}

const field = (): HTMLElement => screen.getByLabelText('Пароль');
const ruleStates = (): string[] =>
  screen.getAllByRole('listitem').map((item) => item.textContent ?? '');

describe('UIPasswordPolicyRules', () => {
  it('marks the rules for Pa1: only the length is unmet', async () => {
    render(<Harness />);

    await userEvent.type(field(), 'Pa1');

    expect(ruleStates()).toEqual([
      'Від 8 до 64 символів не виконано',
      'Принаймні одна цифра виконано',
      'Принаймні одна велика латинська літера (A–Z) виконано',
      'Принаймні одна мала літера виконано',
    ]);
  });

  it.each([
    ['PASSWORD1', 3],
    ['Пароль123', 2],
  ])('marks %s with rule %i unmet', async (value, index) => {
    render(<Harness />);

    await userEvent.type(field(), value);

    expect(ruleStates()[index]).toMatch(/не виконано$/);
  });

  it('marks every rule met for a compliant password', async () => {
    render(<Harness />);

    await userEvent.type(field(), 'Password1');

    ruleStates().forEach((state) => expect(state).toMatch(/ виконано$/));
  });

  it('is a plain list with the given id and is not a live region', () => {
    render(<Harness />);

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(list).toHaveAttribute('role', 'list');
    expect(list).toHaveAttribute('id', RULES_ID);
    expect(list).not.toHaveAttribute('aria-live');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the keys the evaluator returns, in the order it returns them', () => {
    const evaluate = jest.fn<PasswordRuleViewSet, [string]>(() => ({
      items: [
        { key: 'lowercaseRequired', met: true },
        { key: 'invalidLength', met: false },
      ],
    }));

    render(<Harness evaluate={evaluate} />);

    expect(ruleStates()).toEqual([
      'Принаймні одна мала літера виконано',
      'Від 8 до 64 символів не виконано',
    ]);
  });

  it('hands the watched value to the evaluator', async () => {
    const evaluate = jest.fn<PasswordRuleViewSet, [string]>(evaluatePassword);

    render(<Harness evaluate={evaluate} />);
    await userEvent.type(field(), 'Pa');

    expect(evaluate).toHaveBeenLastCalledWith('Pa');
  });

  it('treats an unregistered field as empty', () => {
    const evaluate = jest.fn<PasswordRuleViewSet, [string]>(evaluatePassword);

    function Bare(): JSX.Element {
      const methods = useForm();
      return (
        <I18nextProvider i18n={i18n}>
          <FormProviderBridge methods={methods}>
            <UIPasswordPolicyRules id="bare-rules" name="password" evaluate={evaluate} />
          </FormProviderBridge>
        </I18nextProvider>
      );
    }
    render(<Bare />);

    expect(evaluate).toHaveBeenCalledWith('');
    expect(ruleStates()[0]).toMatch(/не виконано$/);
  });

  it('has no axe violations with met and unmet rules', async () => {
    const view = render(<Harness />);
    await userEvent.type(field(), 'Pa1');

    await expectNoA11yViolations(view.container);
  });
});
