import type { AuditEvent, AuditSink } from '@/lib/types/access/audit';
import { buildAccessToken, buildClaims } from '@tests/builders';

jest.mock('@/config/dependency-injection-config', () => {
  throw new Error('the DI composition root must not be reachable from the paint path');
});

describe('audit correlation on the pre-container hydration path (#114, FR-24)', () => {
  it('correlates the login that module-scope hydration emits, no container composed', async () => {
    const events: AuditEvent[] = [];
    const sink: AuditSink = {
      record(event: AuditEvent): void {
        events.push(event);
      },
    };

    await jest.isolateModulesAsync(async () => {
      const { default: auditCore } = await import('@/lib/access/audit-core');
      auditCore.useSink(sink);
      const { default: authStateVar } = await import('@auth/stores/auth-var');
      authStateVar.set({ token: buildAccessToken(buildClaims()) });

      await import('@auth/components/protected-route');

      const { default: correlationIdSource } =
        await import('@/lib/observability/correlation-id-source');
      expect(events.map((event) => event.type)).toEqual(['login']);
      expect(events[0]?.metadata?.correlationId).toBe(correlationIdSource.current());
    });

    expect(events[0]?.metadata?.correlationId).toEqual(expect.any(String));
  });
});
