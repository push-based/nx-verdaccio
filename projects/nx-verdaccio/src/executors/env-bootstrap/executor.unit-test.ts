import * as devkit from '@nx/devkit';
import { type ExecutorContext } from '@nx/devkit';
import { MockAsyncIterableIterator } from '@push-based/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PACKAGE_NAME } from '../../plugin/constants';
import * as bootstrapExecutorModule from './bootstrap-env';
import runBootstrapExecutor from './executor';

describe('runBootstrapExecutor', () => {
  const e2eProjectName = 'my-lib-e2e';
  const e2eProjectsConfiguration = {
    root: `e2e/${e2eProjectName}`,
  };
  const context: ExecutorContext = {
    cwd: 'test',
    isVerbose: false,
    root: 'tmp/environments/test',
    projectName: e2eProjectName,
    targetName: 'nxv-env-bootstrap',
    projectsConfigurations: {
      version: 2,
      projects: {
        [e2eProjectName]: e2eProjectsConfiguration,
      },
    },
    nxJsonConfiguration: {
      plugins: [],
    },
  };
  const stopVerdaccioTask = {
    project: e2eProjectName,
    target: 'nxv-verdaccio-stop',
    configuration: undefined,
  };

  const bootstrapEnvironmentSpy = vi.spyOn(
    bootstrapExecutorModule,
    'bootstrapEnvironment'
  );
  const runExecutorSpy = vi.spyOn(devkit, 'runExecutor');
  const infoLoggerSpy = vi.spyOn(devkit.logger, 'info');
  const errorLoggerSpy = vi.spyOn(devkit.logger, 'error');

  beforeEach(() => {
    bootstrapEnvironmentSpy.mockResolvedValueOnce({
      registry: {
        host: 'localhost',
        pid: 7777,
        port: 4387,
        protocol: 'http',
        storage: 'tmp/storage',
        url: 'http://localhost:4873',
      },
      environmentRoot: `tmp/environments/${e2eProjectName}`,
      stop: expect.any(Function),
    });

    runExecutorSpy.mockResolvedValue(
      new MockAsyncIterableIterator<{ success: boolean; command: string }>({
        success: true,
        command: 'Process killed successfully.',
      })
    );
  });

  afterEach(() => {
    runExecutorSpy.mockReset();
  });

  it('should env-bootstrap environment correctly', async () => {
    await expect(
      runBootstrapExecutor(
        {
          environmentRoot: `tmp/environments/${e2eProjectName}`,
          verbose: true,
        },
        context
      )
    ).resolves.toStrictEqual({
      success: true,
      command: 'Bootstrapped environment successfully.',
    });

    expect(errorLoggerSpy).not.toHaveBeenCalled();
    expect(infoLoggerSpy).toHaveBeenCalledTimes(1);
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      `Execute ${PACKAGE_NAME}:nxv-env-bootstrap with options: ${JSON.stringify(
        {
          environmentRoot: `tmp/environments/${e2eProjectName}`,
          verbose: true,
        },
        null,
        2
      )}`
    );

    expect(runExecutorSpy).toHaveBeenCalledTimes(1);
    expect(runExecutorSpy).toHaveBeenCalledWith(
      stopVerdaccioTask,
      {
        filePath: expect.toMatchPath(
          `tmp/environments/${e2eProjectName}/verdaccio-registry.json`
        ),
        verbose: true,
      },
      context
    );
  });

  it('should pass options to bootstrapEnvironment', async () => {
    const environmentRoot = 'static-environments/dummy-react-app';
    await expect(
      runBootstrapExecutor(
        {
          environmentRoot,
        },
        context
      )
    ).resolves.toStrictEqual({
      success: true,
      command: 'Bootstrapped environment successfully.',
    });

    expect(runExecutorSpy).toHaveBeenCalledWith(
      stopVerdaccioTask,
      {
        filePath: expect.toMatchPath(
          `${environmentRoot}/verdaccio-registry.json`
        ),
      },
      context
    );
  });

  it('should throw if bootstrappingEnvironment fails', async () => {
    bootstrapEnvironmentSpy.mockReset();
    bootstrapEnvironmentSpy.mockRejectedValueOnce(
      new Error('Failed to env-bootstrap environment')
    );
    await expect(runBootstrapExecutor({}, context)).resolves.toStrictEqual({
      success: false,
      command: 'Failed to env-bootstrap environment',
    });

    expect(errorLoggerSpy).toHaveBeenCalledTimes(1);
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      Error('Failed to env-bootstrap environment')
    );

    expect(runExecutorSpy).toHaveBeenCalledTimes(0);
  });
});
