import { describe, expect, it, vi } from 'vitest';
import { bootstrapEnvironment } from './bootstrap-env';
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
      bootstrapEnvironment({
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
      environmentRoot: 'tmp/environments/my-lib-e2e',
      stop: expect.any(Function),
    });

    expect(startVerdaccioServerSpy).toHaveBeenCalledTimes(1);
    expect(startVerdaccioServerSpy).toHaveBeenCalledWith({
      //environmentRoot: 'tmp/environments/my-lib-e2e',
      //keepServerRunning: true,
      projectName: 'my-lib-e2e',
      storage: expect.toMatchPath('tmp/environments/my-lib-e2e/storage'),
      readyWhen: 'Environment ready under',
      verbose: undefined,
    });

    expect(setupNpmWorkspaceSpy).toHaveBeenCalledTimes(1);
    expect(setupNpmWorkspaceSpy).toHaveBeenCalledWith(
      expect.toMatchPath('tmp/environments/my-lib-e2e'),
      undefined
    );

    expect(configureRegistrySpy).toHaveBeenCalledTimes(1);
    expect(configureRegistrySpy).toHaveBeenCalledWith(
      {
        host: 'localhost',
        port: 4387,
        url: 'http://localhost:4873',
        userconfig: 'tmp/environments/my-lib-e2e/.npmrc',
      },
      undefined
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
