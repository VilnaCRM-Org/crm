import getSnapshotName from '../../visual/get-registration-notification-snapshot-name';

describe('getSnapshotName', () => {
  it('uses distinct snapshot names for success and error states on the same screen', () => {
    expect(getSnapshotName('uk', 'full', 'success')).toBe('uk-success-full.png');
    expect(getSnapshotName('uk', 'full', 'error')).toBe('uk-error-full.png');
  });
});
