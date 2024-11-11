import { beforeEach, describe, expect, it, vi } from 'vitest';
import runNpmInstallExecutor from './executor';
import { MEMFS_VOLUME } from '@push-based/test-utils';
import * as execProcessModule from '../../internal/execute-process';
import { logger, readJsonFile } from '@nx/devkit';
import { join } from 'node:path';

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
  };
});

describe('runNpmInstallExecutor', () => {
  const executeProcessSpy = vi
    .spyOn(execProcessModule, 'executeProcess')
    .mockImplementation(vi.fn());

  beforeEach(() => {
    executeProcessSpy.mockReset();
  });

  it('should execute npm install for the given project', async () => {
    await expect(
      runNpmInstallExecutor(
        {
          environmentRoot: 'tmp/environments/my-lib-e2e',
        },
        {
          root: 'tmp/environments/my-lib',
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
      command: 'Installed dependencies successfully.',
      success: true,
    });

    expect(readJsonFile).toHaveBeenCalledTimes(1);
    expect(readJsonFile).toHaveBeenCalledWith(
      join('dist', 'projects', 'my-lib', 'package.json')
    );

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(`Installing my-lib@1.0.0 in`)
    );

    expect(executeProcessSpy).toHaveBeenCalledTimes(1);
    expect(executeProcessSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'npm',
        args: [
          'install',
          'my-lib@1.0.0',
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
        verbose: true,
      })
    );
  });
});
