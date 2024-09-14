import runBootstrapExecutor from './executor';
import * as bootstrapEnvModule from './bootstrap-env';
import { beforeEach, expect, vi, it, describe } from 'vitest';
import { logger } from '@nx/devkit';

vi.mock('@nx/devkit', async () => {
  const actual = await vi.importActual('@nx/devkit');
  return {
    ...actual,
    logger: {
      info: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('runBootstrapExecutor', () => {
  const bootstrapEnvironmentSpy = vi
    .spyOn(bootstrapEnvModule, 'bootstrapEnvironment')
    .mockResolvedValue({
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

  beforeEach(() => {
    bootstrapEnvironmentSpy.mockReset();
  });

  it('should bootstrap environment correctly', async () => {
    await expect(
      runBootstrapExecutor(
        {},
        {
          cwd: 'test',
          isVerbose: false,
          root: 'tmp/environments/test',
          projectName: 'my-lib-e2e',
          projectsConfigurations: {
            version: 2,
            projects: {
              'my-lib': {
                root: 'e2e/my-lib-e2e',
              },
            },
          },
        }
      )
    ).resolves.toStrictEqual({
      success: true,
      command: 'Bootstraped environment successfully.',
    });

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      'Execute @org/build-env:bootstrap with options: {}'
    );

    expect(bootstrapEnvironmentSpy).toHaveBeenCalledTimes(1);
    expect(bootstrapEnvironmentSpy).toHaveBeenCalledWith({
      projectName: 'my-lib-e2e',
      environmentProject: 'my-lib-e2e',
      environmentRoot: 'tmp/environments/my-lib-e2e',
      readyWhen: 'Environment ready under',
    });
  });

  it('should pass options to bootstrapEnvironment', async () => {
    await expect(
      runBootstrapExecutor(
        {
          environmentRoot: 'static-environments/dummy-react-app',
        },
        {
          cwd: 'test',
          isVerbose: false,
          root: 'tmp/environments/test',
          projectName: 'my-lib-e2e',
          projectsConfigurations: {
            version: 2,
            projects: {
              'my-lib': {
                root: 'e2e/my-lib-e2e',
              },
            },
          },
        }
      )
    ).resolves.toStrictEqual({
      success: true,
      command: 'Bootstraped environment successfully.',
    });

    expect(bootstrapEnvironmentSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        environmentRoot: 'static-environments/dummy-react-app',
      })
    );
  });

  it('should throw if bootstrapping environment fails', async () => {
    bootstrapEnvironmentSpy.mockRejectedValue(
      new Error('Failed to bootstrap environment')
    );
    await expect(
      runBootstrapExecutor(
        {},
        {
          cwd: 'test',
          isVerbose: false,
          root: 'tmp/environments/test',
          projectName: 'my-lib-e2e',
          projectsConfigurations: {
            version: 2,
            projects: {
              'my-lib': {
                root: 'e2e/my-lib-e2e',
              },
            },
          },
        }
      )
    ).resolves.toStrictEqual({
      success: false,
      command: Error('Failed to bootstrap environment'),
    });

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      'Execute @org/build-env:bootstrap with options: {}'
    );

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      Error('Failed to bootstrap environment')
    );

    expect(bootstrapEnvironmentSpy).toHaveBeenCalledTimes(1);
    expect(bootstrapEnvironmentSpy).toHaveBeenCalledWith({
      projectName: 'my-lib-e2e',
      environmentProject: 'my-lib-e2e',
      environmentRoot: 'tmp/environments/my-lib-e2e',
      readyWhen: 'Environment ready under',
    });
  });
});
