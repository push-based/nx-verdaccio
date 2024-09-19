import { describe, expect, it, vi } from 'vitest';
import { runBootstrapEnvironment } from './bootstrap-env';
import * as verdaccioRegistryModule from './verdaccio-registry';
import * as npmModule from './npm';
import * as fs from 'node:fs/promises';

vi.mock('@nx/devkit', async () => {
  const actual = await vi.importActual('@nx/devkit');
  return {
    ...actual,
    logger: {
      info: vi.fn(),
    },
    readJsonFile: vi.fn().mockResolvedValue({
      pid: 7777,
      port: 4387,
      url: 'http://localhost:4873',
      host: 'localhost',
      protocol: 'http',
      storage: 'tmp/storage',
    }),
  };
});

describe('bootstrapEnvironment', () => {
  const startVerdaccioServerSpy = vi
    .spyOn(verdaccioRegistryModule, 'startVerdaccioServer')
    .mockResolvedValue({
      registry: {
        host: 'localhost',
        pid: 7777,
        port: 4387,
        protocol: 'http',
        storage: 'tmp/storage',
        url: 'http://localhost:4873',
      },
      stop: vi.fn(),
    });
  const setupNpmWorkspaceSpy = vi
    .spyOn(npmModule, 'setupNpmWorkspace')
    .mockImplementation(vi.fn());
  const configureRegistrySpy = vi
    .spyOn(npmModule, 'configureRegistry')
    .mockImplementation(vi.fn());
  const writeFileSpy = vi.spyOn(fs, 'writeFile').mockImplementation(vi.fn());

  it('should create environment', async () => {
    await expect(
      runBootstrapEnvironment({
        projectName: 'my-lib-e2e',
        environmentRoot: 'tmp/environments/my-lib-e2e',
      })
    ).resolves.toStrictEqual({
      registry: {
        host: 'localhost',
        pid: 7777,
        port: 4387,
        protocol: 'http',
        storage: 'tmp/storage',
        url: 'http://localhost:4873',
      },
      root: 'tmp/environments/my-lib-e2e',
      stop: expect.any(Function),
    });

    expect(startVerdaccioServerSpy).toHaveBeenCalledTimes(1);
    expect(startVerdaccioServerSpy).toHaveBeenCalledWith({
      projectName: 'my-lib-e2e',
      storage: 'tmp/environments/my-lib-e2e/storage',
      verbose: false,
    });

    expect(setupNpmWorkspaceSpy).toHaveBeenCalledTimes(1);
    expect(setupNpmWorkspaceSpy).toHaveBeenCalledWith(
      'tmp/environments/my-lib-e2e',
      false
    );

    expect(configureRegistrySpy).toHaveBeenCalledTimes(1);
    expect(configureRegistrySpy).toHaveBeenCalledWith(
      {
        host: 'localhost',
        pid: 7777,
        port: 4387,
        protocol: 'http',
        storage: 'tmp/storage',
        url: 'http://localhost:4873',
        userconfig: 'tmp/environments/my-lib-e2e/.npmrc',
      },
      false
    );

    expect(writeFileSpy).toHaveBeenCalledTimes(1);
    expect(writeFileSpy).toHaveBeenCalledWith(
      'tmp/environments/my-lib-e2e/verdaccio-registry.json',
      JSON.stringify(
        {
          host: 'localhost',
          pid: 7777,
          port: 4387,
          protocol: 'http',
          storage: 'tmp/storage',
          url: 'http://localhost:4873',
        },
        null,
        2
      )
    );
  });
});
