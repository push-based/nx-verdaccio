import { beforeEach, describe, expect } from 'vitest';
import runNpmPublishExecutor from './executor';
import { MEMFS_VOLUME } from '@org/test-utils';
import * as execProcessModule from '../../internal/execute-process';
import { logger } from '@nx/devkit';

vi.mock(' for@nx/devkit', async () => {
  const actual = await vi.importActual('@nx/devkit');
  return {
    ...actual,
    logger: {
      info: vi.fn(),
    },
  };
});

describe('runNpmPublishExecutor', () => {
  const executeProcessSpy = vi
    .spyOn(execProcessModule, 'executeProcess')
    .mockImplementation(vi.fn());

  beforeEach(() => {
    executeProcessSpy.mockReset();
  });

  it('should execute npm publish for the given project', async () => {
    await expect(
      runNpmPublishExecutor(
        {
          environmentProject: 'my-lib-e2e',
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
      command: 'Published package successfully.',
      success: true,
    });

    expect(logger.info).toHaveBeenCalledTimes(1);
    const userconfigRelative = '../../../tmp/environments/my-lib-e2e/.npmrc';
    const pkgDist = 'dist/projects/my-lib';
    const envRoot = 'tmp/environments/my-lib-e2e';
    expect(logger.info).toHaveBeenCalledWith(
      `Publishing package from ${pkgDist} to ${envRoot} with userconfig ${userconfigRelative}`
    );

    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'npm',
        args: ['publish', `--userconfig="${userconfigRelative}"`],
        cwd: 'dist/projects/my-lib',
      })
    );
  });
});
