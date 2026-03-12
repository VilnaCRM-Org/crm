// @jest-environment node

import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const readFile = (relativePath: string): string =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

describe('auth client runtime dependencies', () => {
  it('avoids pulling zod into the client auth response path', () => {
    const apiResponses = readFile('src/modules/user/features/auth/types/api-responses.ts');
    const loginSlice = readFile('src/modules/user/store/login-slice.ts');
    const registrationSlice = readFile('src/modules/user/store/registration-slice.ts');

    expect(apiResponses).not.toContain("from 'zod'");
    expect(loginSlice).not.toContain('safeParse(');
    expect(registrationSlice).not.toContain('safeParse(');
  });

  it('keeps the browser auth runtime free of redux and dependency injection bootstrapping', () => {
    const clientEntry = readFile('src/index.tsx');
    const authHook = readFile('src/modules/user/features/auth/hooks/use-auth-store.ts');
    const loginApi = readFile('src/modules/user/features/auth/repositories/login-api.ts');
    const registrationApi = readFile('src/modules/user/features/auth/repositories/registration-api.ts');
    const uiButton = readFile('src/components/ui-button/index.tsx');

    expect(clientEntry).not.toContain("import 'reflect-metadata'");
    expect(clientEntry).not.toContain("from 'react-redux'");
    expect(clientEntry).not.toContain("from '@/stores'");
    expect(clientEntry).not.toContain("from '@/config/dependency-injection-config'");

    expect(authHook).not.toContain("from '@/stores/hooks'");
    expect(authHook).not.toContain("from '@/stores'");

    expect(loginApi).not.toContain("from 'tsyringe'");
    expect(registrationApi).not.toContain("from 'tsyringe'");
    expect(uiButton).not.toContain("from 'react-router-dom'");
  });

  it('keeps module federation disabled to prevent async bootstrap waterfall on mobile', () => {
    const rsbuildConfig = readFile('rsbuild.config.ts');

    expect(rsbuildConfig).not.toContain('@module-federation/rsbuild-plugin');
    expect(rsbuildConfig).not.toContain('pluginModuleFederation');
  });
});
