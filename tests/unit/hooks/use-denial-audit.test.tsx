// @jest-environment jsdom

import '@tests/unit/utils/setup-bun-dom';
import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import type { RenderHookResult } from '@testing-library/react';
import { StrictMode } from 'react';

import useDenialAudit from '@/hooks/use-denial-audit';
import accessCore from '@/lib/access/access-core';
import { PERMISSIONS } from '@/lib/access/permission-catalog';
import type { Permission } from '@/lib/types/access/permission';
import { buildPrincipal } from '@tests/builders';

interface AuditProps {
  refusal: string | null;
  permission: Permission;
  path: string;
}

const FIRST_PATH = '/contacts';
const SECOND_PATH = '/contacts/archive';
const PERMISSION: Permission = PERMISSIONS.contactWrite;

const useAuditProbe = ({ refusal, permission, path }: AuditProps): void =>
  useDenialAudit(refusal, permission, path);

const renderAudit = (props: AuditProps): RenderHookResult<void, AuditProps> =>
  renderHook(useAuditProbe, { initialProps: props });

const renderStrictAudit = (props: AuditProps): RenderHookResult<void, AuditProps> =>
  renderHook(useAuditProbe, { initialProps: props, wrapper: StrictMode });

const refusalFor = (principalId: string, path: string): string =>
  [principalId, PERMISSION, path].join(' ');

describe('useDenialAudit (#114)', () => {
  let recordDenial: jest.SpyInstance;

  beforeEach(() => {
    recordDenial = jest.spyOn(accessCore, 'recordDenial');
  });

  afterEach(() => {
    recordDenial.mockRestore();
  });

  it('records exactly one denial carrying the permission and the path', () => {
    const { id } = buildPrincipal();

    renderAudit({ refusal: refusalFor(id, FIRST_PATH), permission: PERMISSION, path: FIRST_PATH });

    expect(recordDenial).toHaveBeenCalledTimes(1);
    expect(recordDenial).toHaveBeenCalledWith(PERMISSION, { path: FIRST_PATH });
  });

  it('records nothing while there is no refusal', () => {
    renderAudit({ refusal: null, permission: PERMISSION, path: FIRST_PATH });

    expect(recordDenial).not.toHaveBeenCalled();
  });

  it('records one denial under StrictMode, which replays the mount effect', () => {
    const { id } = buildPrincipal();

    renderStrictAudit({
      refusal: refusalFor(id, FIRST_PATH),
      permission: PERMISSION,
      path: FIRST_PATH,
    });

    expect(recordDenial).toHaveBeenCalledTimes(1);
    expect(recordDenial).toHaveBeenCalledWith(PERMISSION, { path: FIRST_PATH });
  });

  it('does not record again when only the path changes under an unchanged refusal', () => {
    const { id } = buildPrincipal();
    const refusal = refusalFor(id, FIRST_PATH);

    const view = renderAudit({ refusal, permission: PERMISSION, path: FIRST_PATH });
    expect(recordDenial).toHaveBeenCalledTimes(1);

    view.rerender({ refusal, permission: PERMISSION, path: SECOND_PATH });

    expect(recordDenial).toHaveBeenCalledTimes(1);
    expect(recordDenial).not.toHaveBeenCalledWith(PERMISSION, { path: SECOND_PATH });
  });

  it('records a second denial when the refusal changes on a re-render', () => {
    const { id } = buildPrincipal();

    const view = renderAudit({
      refusal: refusalFor(id, FIRST_PATH),
      permission: PERMISSION,
      path: FIRST_PATH,
    });
    view.rerender({
      refusal: refusalFor(id, SECOND_PATH),
      permission: PERMISSION,
      path: SECOND_PATH,
    });

    expect(recordDenial).toHaveBeenCalledTimes(2);
    expect(recordDenial).toHaveBeenNthCalledWith(1, PERMISSION, { path: FIRST_PATH });
    expect(recordDenial).toHaveBeenNthCalledWith(2, PERMISSION, { path: SECOND_PATH });
  });

  it('records the same refusal again once an allowance has cleared it', () => {
    const { id } = buildPrincipal();
    const refusal = refusalFor(id, FIRST_PATH);

    const view = renderAudit({ refusal, permission: PERMISSION, path: FIRST_PATH });
    view.rerender({ refusal: null, permission: PERMISSION, path: FIRST_PATH });
    expect(recordDenial).toHaveBeenCalledTimes(1);

    view.rerender({ refusal, permission: PERMISSION, path: FIRST_PATH });

    expect(recordDenial).toHaveBeenCalledTimes(2);
    expect(recordDenial).toHaveBeenNthCalledWith(2, PERMISSION, { path: FIRST_PATH });
  });
});
