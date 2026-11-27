import {
  buildNotificationDraft,
  buildNotificationDraftSet,
} from '@tests/builders/notification-draft';

describe('notification draft builders', () => {
  it('builds a success draft with a fixed catalog key and no action', () => {
    const draft = buildNotificationDraft();

    expect(draft.kind).toBe('success');
    expect(draft.messageKey).toBe('settings.toasts.saved');
    expect(draft).not.toHaveProperty('action');
  });

  it('lets an override win over the defaults', () => {
    const draft = buildNotificationDraft({
      kind: 'error',
      messageKey: 'settings.toasts.save_failed',
    });

    expect(draft.kind).toBe('error');
    expect(draft.messageKey).toBe('settings.toasts.save_failed');
  });

  it('builds three drafts by default and as many as asked', () => {
    expect(buildNotificationDraftSet().items).toHaveLength(3);
    expect(buildNotificationDraftSet(5).items).toHaveLength(5);
    expect(buildNotificationDraftSet(0).items).toHaveLength(0);
  });

  it('applies the overrides to every draft of the set and keeps the fixed keys', () => {
    const { items } = buildNotificationDraftSet(3, { kind: 'error' });

    expect(items.map((draft) => draft.kind)).toEqual(['error', 'error', 'error']);
    expect(items.map((draft) => draft.messageKey)).toEqual([
      'settings.toasts.saved',
      'settings.toasts.email_sent',
      'settings.toasts.password_changed',
    ]);
  });
});
