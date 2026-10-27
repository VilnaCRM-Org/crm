import { render } from '@testing-library/react';

import QrCodeImage from '@/modules/user/features/settings/components/qr-code-image';
import { buildOtpauthUri } from '@tests/builders';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

describe('QrCodeImage accessibility', () => {
  it('has no WCAG 2.1 AA violation', async () => {
    const { container } = render(
      <main>
        <QrCodeImage value={buildOtpauthUri()} label="QR-код для налаштування автентифікатора" />
      </main>
    );

    await expectNoA11yViolations(container);
  });
});
