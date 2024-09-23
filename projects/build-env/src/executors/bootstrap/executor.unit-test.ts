import runBootstrapExecutor from './executor';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as devkit from '@nx/devkit';
import * as bootstrapExecutorModule from './bootstrap-env';
import { DEFAULT_STOP_VERDACCIO_TARGET } from '../../internal/constants';

describe('runBootstrapExecutor', () => {
  const e2eProjectName = 'my-lib-e2e';
  const e2eProjectsConfiguration = {
    root: `e2e/${e2eProjectName}`,
  };
  const context = {
    cwd: 'test',
    isVerbose: false,
    root: 'tmp/environments/test',
    projectName: e2eProjectName,
    projectsConfigurations: {
      version: 2,
      projects: {
        [e2eProjectName]: e2eProjectsConfiguration,
      },
    },
  };
  const stopVerdaccioTask = {
    project: e2eProjectName,
    target: DEFAULT_STOP_VERDACCIO_TARGET,
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
    runExecutorSpy.mockResolvedValueOnce({
      success: true,
      command: 'Process killed successfully.',
    });
  });
  afterEach(() => {
    runExecutorSpy.mockReset();
  });

  it('should bootstrap environment correctly', async () => {
    await expect(
      runBootstrapExecutor(
        {
          environmentRoot: `tmp/environments/${e2eProjectName}`,
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
      `Execute @push-based/build-env:bootstrap with options: ${JSON.stringify(
        {
          environmentRoot: `tmp/environments/${e2eProjectName}`,
        },
        null,
        2
      )}`
    );

    expect(runExecutorSpy).toHaveBeenCalledTimes(1);
    expect(runExecutorSpy).toHaveBeenCalledWith(
      stopVerdaccioTask,
      {
        filePath: `tmp/environments/${e2eProjectName}/verdaccio-registry.json`,
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
        filePath: `${environmentRoot}/verdaccio-registry.json`,
      },
      context
    );
  });

  it('should throw if bootstrappingEnvironment fails', async () => {
    bootstrapEnvironmentSpy.mockReset();
    bootstrapEnvironmentSpy.mockRejectedValueOnce(
      new Error('Failed to bootstrap environment')
    );
    await expect(runBootstrapExecutor({}, context)).resolves.toStrictEqual({
      success: false,
      command: 'Failed to bootstrap environment',
    });

    expect(infoLoggerSpy).toHaveBeenCalledTimes(1);
    expect(infoLoggerSpy).toHaveBeenCalledWith(
      'Execute @push-based/build-env:bootstrap with options: {}'
    );

    expect(errorLoggerSpy).toHaveBeenCalledTimes(1);
    expect(errorLoggerSpy).toHaveBeenCalledWith(
      Error('Failed to bootstrap environment')
    );

    expect(runExecutorSpy).toHaveBeenCalledTimes(0);
  });
});
