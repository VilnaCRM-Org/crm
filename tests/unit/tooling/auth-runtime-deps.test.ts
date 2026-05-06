// @jest-environment node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

describe('auth client runtime dependencies', () => {
  it('keeps auth response validation centralized in the shared schema module', () => {
    const apiResponses = readFile('src/modules/user/features/auth/types/api-responses.ts');
    const loginSlice = readFile('src/modules/user/store/login-slice.ts');
    const registrationSlice = readFile('src/modules/user/store/registration-slice.ts');

    expect(apiResponses).toContain("from 'zod'");
    expect(loginSlice).toContain('LoginResponseSchema.safeParse(apiResponse)');
    expect(registrationSlice).toContain('RegistrationResponseSchema.safeParse(apiResponse)');
  });

  it('keeps auth hooks and shared UI decoupled from redux and router bindings', () => {
    const authHook = readFile('src/modules/user/features/auth/hooks/use-auth-store.ts');
    const uiButton = readFile('src/components/ui-button/index.tsx');

    expect(authHook).not.toContain("from '@/stores/hooks'");
    expect(authHook).not.toContain("from '@/stores'");
    expect(uiButton).not.toContain("from 'react-router-dom'");
  });

  it('keeps module federation disabled to prevent async bootstrap waterfall on mobile', () => {
    const rsbuildConfig = readFile('rsbuild.config.ts');

    expect(rsbuildConfig).not.toContain('@module-federation/rsbuild-plugin');
    expect(rsbuildConfig).not.toContain('pluginModuleFederation');
  });
});
