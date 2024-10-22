import { beforeEach, describe, expect, vi, it } from 'vitest';
import runNpmPublishExecutor from './executor';
import { MEMFS_VOLUME, osAgnosticPath } from '@push-based/test-utils';
import * as execProcessModule from '../../internal/execute-process';
import * as pkgVersionModule from './pkg-version';
import { logger } from '@nx/devkit';

vi.mock('@nx/devkit', async () => {
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
  const pkgVersionModuleSpy = vi
    .spyOn(pkgVersionModule, 'markPackageJson')
    .mockResolvedValue(undefined);

  beforeEach(() => {
    executeProcessSpy.mockReset();
    pkgVersionModuleSpy.mockReset();
  });

  it('should execute npm publish for the given project', async () => {
    await expect(
      runNpmPublishExecutor(
        {
          environmentRoot: 'tmp/environments/my-lib-e2e',
        },
        {
          root: 'libs/my-lib',
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
      expect.stringContaining(
        `Publishing package from ${pkgDist} to ${envRoot} with userconfig`
      )
    );

    expect(pkgVersionModuleSpy).toHaveBeenCalledTimes(1);
    expect(pkgVersionModuleSpy).toHaveBeenCalledWith(
      expect.toMatchPath('dist/projects/my-lib')
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
