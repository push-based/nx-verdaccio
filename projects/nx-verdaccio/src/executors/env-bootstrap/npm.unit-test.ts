import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bold, red } from 'ansis';
import { MEMFS_VOLUME } from '@push-based/test-utils';
import {
  configureRegistry,
  type ConfigureRegistryOptions,
  setupNpmWorkspace,
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

describe.skip('setupNpmWorkspace', () => {
  let cwdSpy;
  let chdirSpy;
  let consoleInfoSpy;

  beforeEach(() => {
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(MEMFS_VOLUME);
    chdirSpy = vi.spyOn(process, 'chdir').mockImplementation(vi.fn());
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(vi.fn());
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    chdirSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  it('should create npm workspace in given folder', async () => {
    await setupNpmWorkspace('tmp');
    expect(chdirSpy).toHaveBeenCalledTimes(1);
    expect(chdirSpy).toHaveBeenCalledWith('tmp');
    expect(consoleInfoSpy).not.toHaveBeenCalled();
  });

  it('should call infoLog if verbose is given', async () => {
    await setupNpmWorkspace('tmp', true);
    expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      `${red('>')} ${red(bold('Npm Env: '))} Execute: npm init in directory tmp`
    );
  });
});
