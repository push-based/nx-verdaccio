import { beforeEach, describe, expect, it, vi } from 'vitest';
import runNpmInstallExecutor from './executor';
import { MEMFS_VOLUME } from '@push-based/test-utils';
import * as execProcessModule from '../../internal/execute-process';
import { logger, readJsonFile } from '@nx/devkit';
import { join } from 'node:path';
import * as devkit from '@nx/devkit';

vi.mock('@nx/devkit', async () => {
  const actual = await vi.importActual('@nx/devkit');
  return {
    ...actual,
    logger: {
      info: vi.fn(),
    },
    readJsonFile: vi.fn().mockReturnValue({
      name: 'my-lib',
      version: '1.0.0',
    }),
    readTargetOptions: vi.fn(),
  };
});

describe('runNpmInstallExecutor', () => {
  const executeProcessSpy = vi
    .spyOn(execProcessModule, 'executeProcess')
    .mockImplementation(vi.fn());

  const readTargetOptionsSpy = vi.spyOn(devkit, 'readTargetOptions');

  beforeEach(() => {
    executeProcessSpy.mockReset();
    readTargetOptionsSpy.mockReset();

    readTargetOptionsSpy.mockReturnValue({
      options: {
        outputPath: 'dist/projects/my-lib',
        main: 'libs/my-lib/src/index.ts',
        tsConfig: 'libs/my-lib/tsconfig.json',
      },
    });
  });

  it('should execute npm install for the given project', async () => {
    await expect(
      runNpmInstallExecutor(
        {
          environmentRoot: 'tmp/environments/my-lib-e2e',
        },
        {
          root: '.',
          cwd: MEMFS_VOLUME,
          isVerbose: false,
          projectName: 'my-lib',
          targetName: 'pkg-install',
        }
      )
    ).resolves.toStrictEqual({
      command: 'Installed dependencies successfully.',
      success: true,
    });

    expect(readJsonFile).toHaveBeenCalledTimes(1);
    expect(readJsonFile).toHaveBeenCalledWith(
      join('dist', 'projects', 'my-lib', 'package.json')
    );

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(`Installing my-lib in`)
    );

    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'npm',
        args: [
          'install',
          'my-lib',
          '--include=prod',
          // @TODO implement options
          //'--include=dev',
          //'--include=optional',
          '--include=peer',
          '--no-fund',
          '--no-shrinkwrap',
          '--save',
        ],
        cwd: expect.toMatchPath('tmp/environments/my-lib-e2e'),
        verbose: false,
      })
    );
  });
});
