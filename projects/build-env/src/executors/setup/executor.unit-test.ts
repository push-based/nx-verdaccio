import runSetupEnvironmentExecutor from './executor';
import { beforeEach, expect, vi } from 'vitest';
import * as runBuildExecutorModule from '../bootstrap/executor';
import * as executeProcessModule from '../../internal/execute-process';
import * as killProcessExecutorModule from '../kill-process/executor';
import { logger } from '@nx/devkit';

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
  const runBootstrapEnvironmentSpy = vi.spyOn(
    runBuildExecutorModule,
    'default'
  );
  const executeProcessSpy = vi.spyOn(executeProcessModule, 'executeProcess');
  const runKillProcessExecutorSpy = vi.spyOn(
    killProcessExecutorModule,
    'default'
  );

  beforeEach(() => {
    runBootstrapEnvironmentSpy.mockReset();
    executeProcessSpy.mockReset();
  });

  it('should setup environment correctly', async () => {
    runBootstrapEnvironmentSpy.mockResolvedValue({
      success: true,
      command: 'Bootstraped environemnt successfully.',
    });
    runKillProcessExecutorSpy.mockResolvedValue({
      success: true,
      command: 'Kill process successfully',
    });

    await expect(
      runSetupEnvironmentExecutor(
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
      command: 'Environment setup complete.',
    });

    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith({
      args: [
        'build-env-env-install',
        'my-lib-e2e',
        // @TODO check for --environmentRoot too
        expect.stringContaining('my-lib-e2e'),
      ],
      command: 'nx',
      cwd: '/test',
    });

    expect(runKillProcessExecutorSpy).toHaveBeenCalledTimes(1);
    expect(runKillProcessExecutorSpy).toHaveBeenCalledWith(
      {
        filePath: 'tmp/environments/my-lib-e2e/verdaccio-registry.json',
        environmentRoot: 'tmp/environments/my-lib-e2e',
      },
      {
        cwd: 'test',
        isVerbose: false,
        projectName: 'my-lib-e2e',
        projectsConfigurations: {
          projects: {
            'my-lib': {
              root: 'e2e/my-lib-e2e',
            },
          },
          version: 2,
        },
        root: 'tmp/environments/test',
      }
    );
  });

  it('should catch error', async () => {
    runBootstrapEnvironmentSpy.mockRejectedValue(
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
      command: Error('Error in runBootstrapEnvironment'),
    });
  });

  it('should keep server running if keepServerRunning is passed', async () => {
    runBootstrapEnvironmentSpy.mockResolvedValue({
      success: true,
      command: 'Bootstraped environemnt successfully.',
    });
    runKillProcessExecutorSpy.mockResolvedValue({
      success: true,
      command: 'Kill process successfully',
    });

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
      command: 'Environment setup complete.',
    });

    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith({
      args: [
        'build-env-env-install',
        'my-lib-e2e',
        '--environmentRoot="tmp/environments/my-lib-e2e"',
      ],
      command: 'nx',
      cwd: '/test',
    });

    expect(runKillProcessExecutorSpy).toHaveBeenCalledTimes(0);

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      'Verdaccio server kept running under : http://localhost:4873'
    );
  });
});
