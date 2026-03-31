import getRegistrationNotificationSnapshotName from '../../visual/getRegistrationNotificationSnapshotName';

describe('getRegistrationNotificationSnapshotName', () => {
  it('uses distinct snapshot names for success and error states on the same screen', () => {
    expect(getRegistrationNotificationSnapshotName('uk', 'full', 'success')).toBe(
      'uk-success-full.png'
    );
    expect(getRegistrationNotificationSnapshotName('uk', 'full', 'error')).toBe(
      'uk-error-full.png'
    );
  });
});
