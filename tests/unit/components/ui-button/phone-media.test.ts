import loadIsolated from '@tests/unit/utils/isolated-module';

describe('UI_BUTTON_PHONE_MEDIA', () => {
  it('pins the phone query the button theme and its re-pins share', async () => {
    const { default: phoneMedia } = await loadIsolated(
      () => import('@/components/ui-button/phone-media')
    );

    expect(phoneMedia).toBe('@media (max-width: 375px)');
  });
});
