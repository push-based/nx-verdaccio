import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  configureRegistry,
  type ConfigureRegistryOptions,
  unconfigureRegistry,
  VERDACCIO_ENV_TOKEN,
} from './npm';
import { logger } from '@nx/devkit';
import { formatInfo } from '../../internal/logging';

const execMock = vi.fn();
vi.mock('util', () => ({
  promisify: vi.fn(
    () =>
      (...args) =>
        execMock(...args)
  ),
}));

vi.mock('@nx/devkit', async () => {
  const actual = await vi.importActual('@nx/devkit');
  return {
    ...actual,
    logger: {
      info: vi.fn(),
    },
  };
});

describe('configureRegistry', () => {
  beforeEach(() => {
    execMock.mockRestore();
  });
  it('should set the npm registry and authToken', async () => {
    const processResult: ConfigureRegistryOptions = {
      port: 4873,
      host: 'localhost',
      url: 'http://localhost:4873',
      userconfig: 'test-config',
    };

    await configureRegistry(processResult);

    expect(execMock).toHaveBeenCalledTimes(2);
    expect(execMock).toHaveBeenCalledWith(
      'npm config set registry="http://localhost:4873" --userconfig="test-config"',
      { windowsHide: true }
    );

    expect(execMock).toHaveBeenCalledWith(
      'npm config set //localhost:4873/:_authToken "secretVerdaccioToken" --userconfig="test-config"',
      { windowsHide: true }
    );
  });

  it('should set and log registry and authToken commands if verbose is true', async () => {
    const processResult: ConfigureRegistryOptions = {
      port: 4873,
      host: 'localhost',
      url: 'http://localhost:4873',
      userconfig: 'test-config',
    };

    await configureRegistry(processResult, true);

    expect(execMock).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenCalledWith(
      formatInfo(
        'Set registry:\nnpm config set registry="http://localhost:4873" --userconfig="test-config"',
        VERDACCIO_ENV_TOKEN
      )
    );
    expect(logger.info).toHaveBeenCalledWith(
      formatInfo(
        'Set authToken:\nnpm config set //localhost:4873/:_authToken "secretVerdaccioToken" --userconfig="test-config"',
        VERDACCIO_ENV_TOKEN
      )
    );
  });
});

describe('unconfigureRegistry', () => {
  beforeEach(() => {
    execMock.mockRestore();
  });

  it('should delete the npm registry and authToken', async () => {
    const processResult: UnconfigureRegistryOptions = {
      userconfig: 'test-config',
      port: 4873,
      host: 'localhost',
    };

    await unconfigureRegistry(processResult);

    expect(execMock).toHaveBeenCalledTimes(2);
    expect(execMock).toHaveBeenCalledWith(
      'npm config delete registry --userconfig="test-config"',
      { windowsHide: true }
    );

    expect(execMock).toHaveBeenCalledWith(
      'npm config delete //localhost:4873/:_authToken --userconfig="test-config"',
      { windowsHide: true }
    );
  });

  it('should delete and log registry and authToken commands if verbose is true', async () => {
    const processResult: UnconfigureRegistryOptions = {
      userconfig: 'test-config',
      port: 4873,
      host: 'localhost',
    };

    await unconfigureRegistry(processResult, true);

    expect(execMock).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenCalledWith(
      formatInfo(
        'Delete registry:\nnpm config delete registry --userconfig="test-config"',
        VERDACCIO_ENV_TOKEN
      )
    );

    expect(logger.info).toHaveBeenCalledWith(
      formatInfo(
        'Delete authToken:\nnpm config delete //localhost:4873/:_authToken --userconfig="test-config"',
        VERDACCIO_ENV_TOKEN
      )
    );
  });
});
