import runBootstrapExecutor from './executor';
import * as killProcessModule from '../kill-process/executor';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as devkit from '@nx/devkit';
import { DEFAULT_STOP_VERDACCIO_TARGET } from '../../internal/constants';

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
  const runExecutorSpy = vi.spyOn(devkit, 'runExecutor');
  const killProcessModuleSpy = vi.spyOn(killProcessModule, 'default');

  beforeEach(() => {
    runExecutorSpy.mockResolvedValue({
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
    killProcessModuleSpy.mockResolvedValue({
      success: true,
      command: 'Process killed successfully.',
    });
  });
  afterEach(() => {
    runExecutorSpy.mockReset();
    killProcessModuleSpy.mockReset();
  });

  it('should bootstrap environment correctly', async () => {
    await expect(
      runBootstrapExecutor(
        {
          environmentRoot: 'tmp/environments/my-lib-e2e',
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
      command: 'Bootstraped environemnt successfully.',
    });

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      `Execute @push-based/build-env:bootstrap with options: ${JSON.stringify(
        {
          environmentRoot: 'tmp/environments/my-lib-e2e',
        },
        null,
        2
      )}`
    );

    expect(runExecutorSpy).toHaveBeenCalledTimes(1);
    expect(runExecutorSpy).toHaveBeenCalledWith(
      {
        project: 'my-lib-e2e',
        target: DEFAULT_STOP_VERDACCIO_TARGET,
        configuration: undefined,
      },
      {
        projectName: 'my-lib-e2e',
        environmentRoot: 'tmp/environments/my-lib-e2e',
      }
    );
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
      command: 'Bootstraped environemnt successfully.',
    });

    expect(runExecutorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        environmentRoot: 'static-environments/dummy-react-app',
      })
    );
  });

  it('should throw if bootstrapping environment fails', async () => {
    runExecutorSpy.mockRejectedValue(
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
      command: 'Failed to bootstrap environment',
    });

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      'Execute @push-based/build-env:bootstrap with options: {}'
    );

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      Error('Failed to bootstrap environment')
    );

    expect(runExecutorSpy).toHaveBeenCalledTimes(1);
    expect(runExecutorSpy).toHaveBeenCalledWith({
      projectName: 'my-lib-e2e',
    });
  });
});
