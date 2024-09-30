import runSetupEnvironmentExecutor from './executor';
import { beforeEach, expect, vi } from 'vitest';
import * as executeProcessModule from '../../internal/execute-process';
import * as devkit from '@nx/devkit';
import {
  TARGET_ENVIRONMENT_BOOTSTRAP,
  TARGET_ENVIRONMENT_VERDACCIO_STOP,
} from '../../plugin/targets/environment.targets';

vi.mock('@nx/devkit', async () => {
  const actual = await vi.importActual('@nx/devkit');
  return {
    ...actual,
    logger: {
      info: vi.fn(),
      error: vi.fn(),
    },
    readJsonFile: vi.fn().mockReturnValue({
      pid: 4873,
      port: '4873',
      url: 'http://localhost:4873',
    }),
  };
});

describe('runSetupEnvironmentExecutor', () => {
  const runExecutorSpy = vi.spyOn(devkit, 'runExecutor');
  const executeProcessSpy = vi.spyOn(executeProcessModule, 'executeProcess');

  beforeEach(() => {
    runExecutorSpy.mockReset();
    executeProcessSpy.mockReset();
  });

  it('should env-setup environment correctly', async () => {
    runExecutorSpy
      .mockResolvedValueOnce([
        Promise.resolve({
          success: true,
          command: 'Bootstraped environemnt successfully.',
        }),
      ])
      .mockResolvedValueOnce([
        Promise.resolve({
          success: true,
          command: 'Kill process successfully',
        }),
      ]);
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
      runSetupEnvironmentExecutor(
        {
          environmentRoot: 'tmp/environments/my-lib-e2e',
        },
        context
      )
    ).resolves.toStrictEqual({
      success: true,
      command: 'Environment env-setup complete.',
    });

    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith({
      args: [
        'nxv-env-install',
        projectName,
        // @TODO check for --environmentRoot too be OS agnostic path
        expect.stringContaining(projectName),
      ],
      command: 'nx',
      cwd: '/test',
    });

    expect(runExecutorSpy).toHaveBeenCalledTimes(2);
    expect(runExecutorSpy)
      .toHaveBeenCalledWith(
        {
          configuration: undefined,
          project: projectName,
          target: TARGET_ENVIRONMENT_BOOTSTRAP,
        },
        {
          environmentRoot: 'tmp/environments/my-lib-e2e',
          keepServerRunning: true,
        },
        context
      )
      .toHaveBeenCalledWith(
        {
          configuration: undefined,
          project: projectName,
          target: TARGET_ENVIRONMENT_VERDACCIO_STOP,
        },
        {
          filePath: 'tmp/environments/my-lib-e2e/verdaccio-registry.json',
          verbose: undefined,
        },
        context
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
      .mockResolvedValueOnce([
        Promise.resolve({
          success: true,
          command: 'Bootstraped environemnt successfully.',
        }),
      ])
      .mockResolvedValueOnce([
        Promise.resolve({
          success: true,
          command: 'Kill process successfully',
        }),
      ]);
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
        'nxv-env-install',
        'my-lib-e2e',
        '--environmentRoot="tmp/environments/my-lib-e2e"',
      ],
      command: 'nx',
      cwd: '/test',
    });

    expect(runExecutorSpy)
      .toHaveBeenCalledTimes(1)
      .toHaveBeenCalledWith(
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

    expect(devkit.logger.info).toHaveBeenCalledTimes(1);
    expect(devkit.logger.info).toHaveBeenCalledWith(
      'Verdaccio server kept running under : http://localhost:4873'
    );
  });
});
