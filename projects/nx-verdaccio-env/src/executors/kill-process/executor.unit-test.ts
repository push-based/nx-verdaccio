import { beforeEach, describe, expect, vi } from 'vitest';
import runKillProcessExecutor from './executor';
import * as killProcessModule from './kill-process';
import { MEMFS_VOLUME } from '@push-based/test-utils';
import { logger } from '@nx/devkit';
import { PACKAGE_NAME } from '../../plugin/constants';
import { EXECUTOR_ENVIRONMENT_KILL_PROCESS } from './constant';

vi.mock('@nx/devkit', async () => {
  const actual = await vi.importActual('@nx/devkit');
  return {
    ...actual,
    logger: {
      error: vi.fn(),
      info: vi.fn(),
    },
    readJsonFile: vi.fn().mockReturnValue({
      name: 'my-lib',
      version: '1.0.0',
    }),
  };
});

describe('runKillProcessExecutor', () => {
  const killSpy = vi.spyOn(process, 'kill').mockImplementation(vi.fn());
  const killProcessFromPidSpy = vi
    .spyOn(killProcessModule, 'killProcessFromPid')
    .mockImplementation(vi.fn());

  beforeEach(() => {
    killSpy.mockReset();
    killProcessFromPidSpy.mockReset();
  });

  it('should kill process by pid', async () => {
    await expect(
      runKillProcessExecutor(
        {
          pid: 777,
        },
        {
          root: 'tmp/environments/test',
          cwd: MEMFS_VOLUME,
          isVerbose: false,
          projectName: 'my-lib',
          projectsConfigurations: {
            version: 2,
            projects: {
              'my-lib': {
                root: 'libs/my-lib',
                targets: {
                  build: {
                    options: {
                      outputPath: 'dist/projects/my-lib',
                    },
                  },
                },
              },
            },
          },
        }
      )
    ).resolves.toStrictEqual({
      command: 'Process killed successfully.',
      success: true,
    });

    expect(killProcessFromPidSpy).not.toHaveBeenCalled();
    expect(killSpy).toHaveBeenCalledTimes(1);
    expect(killSpy).toHaveBeenCalledWith(777);

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      `Execute ${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_KILL_PROCESS} with options: ${JSON.stringify(
        { pid: 777 },
        null,
        2
      )}`
    );
  });

  it('should load file kill process with pid from file', async () => {
    await expect(
      runKillProcessExecutor(
        {
          filePath: 'tmp/environments/my-lib',
        },
        {
          root: 'tmp/environments/test',
          cwd: MEMFS_VOLUME,
          isVerbose: false,
          projectName: 'my-lib',
          projectsConfigurations: {
            version: 2,
            projects: {
              'my-lib': {
                root: 'libs/my-lib',
                targets: {
                  build: {
                    options: {
                      outputPath: 'dist/projects/my-lib',
                    },
                  },
                },
              },
            },
          },
        }
      )
    ).resolves.toStrictEqual({
      command: 'Process killed successfully.',
      success: true,
    });

    expect(killProcessFromPidSpy).toHaveBeenCalledTimes(1);
    expect(killProcessFromPidSpy).toHaveBeenCalledWith(
      'tmp/environments/my-lib',
      {
        cleanFs: true,
        dryRun: false,
        verbose: false,
      }
    );

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      `Execute ${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_KILL_PROCESS} with options: ${JSON.stringify(
        { filePath: 'tmp/environments/my-lib' },
        null,
        2
      )}`
    );
  });

  it('should handle error caused by process kill', async () => {
    killSpy.mockImplementation(() => {
      throw new Error('Wrong pid!');
    });
    await expect(
      runKillProcessExecutor(
        {
          pid: 777,
        },
        {
          root: 'tmp/environments/test',
          cwd: MEMFS_VOLUME,
          isVerbose: false,
          projectName: 'my-lib',
          projectsConfigurations: {
            version: 2,
            projects: {
              'my-lib': {
                root: 'libs/my-lib',
                targets: {
                  build: {
                    options: {
                      outputPath: 'dist/projects/my-lib',
                    },
                  },
                },
              },
            },
          },
        }
      )
    ).resolves.toStrictEqual({
      success: false,
      command: 'Failed killing process.',
    });

    expect(killSpy).toHaveBeenCalledTimes(1);
    expect(killSpy).toHaveBeenCalledWith(777);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(new Error('Wrong pid!'));
  });
});
