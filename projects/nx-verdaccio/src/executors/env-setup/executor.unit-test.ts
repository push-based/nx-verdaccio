import runSetupEnvironmentExecutor from './executor';
import { beforeEach, expect, vi } from 'vitest';
import * as executeProcessModule from '../../internal/execute-process';
import * as devkit from '@nx/devkit';
import {
  TARGET_ENVIRONMENT_BOOTSTRAP,
  TARGET_ENVIRONMENT_VERDACCIO_STOP,
} from '../../plugin/targets/environment.targets';
import { MockAsyncIterableIterator } from '@push-based/test-utils';
import * as npmModule from './npm';

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

vi.mock('fs/promises', async () => {
  const actual = await vi.importActual<typeof import('fs/promises')>(
    'fs/promises'
  );
  return {
    ...actual,
    readFile: vi.fn().mockResolvedValue(
      JSON.stringify({
        pid: 4873,
        port: '4873',
        url: 'http://localhost:4873',
      })
    ),
  };
});

describe('runSetupEnvironmentExecutor', () => {
  const runExecutorSpy = vi.spyOn(devkit, 'runExecutor');
  const executeProcessSpy = vi.spyOn(executeProcessModule, 'executeProcess');
  const setupNpmWorkspaceSpy = vi.spyOn(npmModule, 'setupNpmWorkspace');

  beforeEach(() => {
    runExecutorSpy.mockReset();
    executeProcessSpy.mockReset();
  });

  it('should env-setup environment correctly', async () => {
    runExecutorSpy
      .mockResolvedValueOnce(
        new MockAsyncIterableIterator<{ success: boolean; command: string }>({
          success: true,
          command: 'Bootstraped environemnt successfully.',
        })
      )
      .mockResolvedValueOnce(
        new MockAsyncIterableIterator<{ success: boolean; command: string }>({
          success: true,
          command: 'Kill process successfully',
        })
      );

    const projectName = 'my-lib-e2e';

    const context = {
      cwd: 'test',
      isVerbose: false,
      root: 'tmp/environments/test',
      projectName,
      projectsConfigurations: {
        version: 2,
        projects: {
          'my-lib': {
            root: 'e2e/my-lib-e2e',
          },
        },
      },
    };

    await expect(
      runSetupEnvironmentExecutor({}, context)
    ).resolves.toStrictEqual({
      success: true,
      command: 'Environment env-setup complete.',
    });

    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith({
      args: [
        'nx',
        'nxv-env-install',
        projectName,
        // @TODO check for --environmentRoot too be OS agnostic path
        expect.stringContaining(projectName),
      ],
      command: 'npx',
      cwd: '/test',
    });

    expect(runExecutorSpy).toHaveBeenCalledTimes(2);
    expect(runExecutorSpy).toHaveBeenCalledWith(
      {
        configuration: undefined,
        project: projectName,
        target: TARGET_ENVIRONMENT_BOOTSTRAP,
      },
      {
        keepServerRunning: true,
      },
      context
    );
    expect(runExecutorSpy).toHaveBeenCalledWith(
      {
        configuration: undefined,
        project: projectName,
        target: TARGET_ENVIRONMENT_VERDACCIO_STOP,
      },
      {
        filePath: expect.toMatchPath(
          'tmp/environments/my-lib-e2e/verdaccio-registry.json'
        ),
        verbose: undefined,
      },
      context
    );

    expect(setupNpmWorkspaceSpy).toHaveBeenCalledTimes(1);
    expect(setupNpmWorkspaceSpy).toHaveBeenCalledWith(
      expect.toMatchPath('tmp/environments/my-lib-e2e'),
      undefined
    );
  });

  it('should catch error cause by runBootstrapEnvironment', async () => {
    runExecutorSpy.mockRejectedValueOnce(
      new Error('Error in runBootstrapEnvironment')
    );

    await expect(
      runSetupEnvironmentExecutor(
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
      command:
        'Failed executing target nxv-env-bootstrap\n Error in runBootstrapEnvironment',
    });
  });

  it('should keep server running if keepServerRunning is passed', async () => {
    runExecutorSpy
      .mockResolvedValueOnce(
        new MockAsyncIterableIterator<{ success: boolean; command: string }>({
          success: true,
          command: 'Bootstraped environemnt successfully.',
        })
      )
      .mockResolvedValueOnce(
        new MockAsyncIterableIterator<{ success: boolean; command: string }>({
          success: true,
          command: 'Kill process successfully',
        })
      );

    const projectName = 'my-lib-e2e';

    const context = {
      cwd: 'test',
      isVerbose: false,
      root: 'e2e/my-lib-e2e',
      projectName,
      projectsConfigurations: {
        version: 2,
        projects: {
          [projectName]: {
            root: 'e2e/my-lib-e2e',
          },
        },
      },
    };

    await expect(
      runSetupEnvironmentExecutor(
        {
          environmentRoot: 'tmp/environments/my-lib-e2e',
          keepServerRunning: true,
        },
        {
          cwd: 'test',
          isVerbose: false,
          root: 'e2e/my-lib-e2e',
          projectName: 'my-lib-e2e',
          projectsConfigurations: {
            version: 2,
            projects: {
              'my-lib-e2e': {
                root: 'e2e/my-lib-e2e',
              },
            },
          },
        }
      )
    ).resolves.toStrictEqual({
      success: true,
      command: 'Environment env-setup complete.',
    });

    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith({
      args: [
        'nx',
        'nxv-env-install',
        'my-lib-e2e',
        '--environmentRoot="tmp/environments/my-lib-e2e"',
      ],
      command: 'npx',
      cwd: '/test',
    });

    expect(runExecutorSpy).toHaveBeenCalledTimes(1);
    expect(runExecutorSpy).toHaveBeenCalledWith(
      {
        configuration: undefined,
        project: 'my-lib-e2e',
        target: TARGET_ENVIRONMENT_BOOTSTRAP,
      },
      expect.objectContaining({
        environmentRoot: 'tmp/environments/my-lib-e2e',
        keepServerRunning: true,
      }),
      context
    );

    expect(devkit.logger.info).toHaveBeenCalledTimes(2);
    expect(devkit.logger.info).toHaveBeenCalledWith(
      'Verdaccio server kept running under : http://localhost:4873'
    );
  });
});
