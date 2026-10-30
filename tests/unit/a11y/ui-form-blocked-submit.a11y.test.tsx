import UIForm from '@/components/ui-form';
import renderWithI18n from '@tests/unit/utils/render-with-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

describe('UIForm blocked submit accessibility', () => {
  it('has no WCAG 2.1 AA violation while the submit is blocked', async () => {
    const { container } = renderWithI18n(
      <main>
        <UIForm<{ name: string }>
          defaultValues={{ name: '' }}
          onSubmit={jest.fn()}
          submitLabel="Готово"
          submittingLabel="Надсилаємо"
          title="Резервні коди"
          titleComponent="h1"
          submitBlockedReason="Спочатку підтвердьте, що зберегли коди"
        >
          <p>Збережіть коди в надійному місці</p>
        </UIForm>
      </main>
    );

    await expectNoA11yViolations(container);
  });
});
