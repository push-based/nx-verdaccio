import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bold, red } from 'ansis';
import { MEMFS_VOLUME } from '@org/test-utils';
import {
  configureRegistry,
  type ConfigureRegistryOptions,
  setupNpmWorkspace,
  unconfigureRegistry,
  type UnconfigureRegistryOptions,
  VERDACCIO_ENV_TOKEN,
} from './npm';
import { execSync } from 'node:child_process';
import { logger } from '@nx/devkit';
import { formatInfo } from '../../internal/logging';

vi.mock('child_process', async () => {
  const actual = await vi.importActual<typeof import('child_process')>(
    'child_process'
  );
  return {
    ...actual,
    execSync: vi.fn(),
  };
});

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
  it('should set the npm registry and authToken', () => {
    const processResult: ConfigureRegistryOptions = {
      port: 4873,
      host: 'localhost',
      url: 'http://localhost:4873',
      userconfig: 'test-config',
    };

    configureRegistry(processResult);

    expect(execSync).toHaveBeenCalledTimes(2);
    expect(execSync).toHaveBeenCalledWith(
      'npm config set registry="http://localhost:4873" --userconfig="test-config"'
    );

    expect(execSync).toHaveBeenCalledWith(
      'npm config set //localhost:4873/:_authToken "secretVerdaccioToken" --userconfig="test-config"'
    );
  });

  it('should set and log registry and authToken commands if verbose is true', () => {
    const processResult: ConfigureRegistryOptions = {
      port: 4873,
      host: 'localhost',
      url: 'http://localhost:4873',
      userconfig: 'test-config',
    };

    configureRegistry(processResult, true);

    expect(execSync).toHaveBeenCalledTimes(2);
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
  it('should delete the npm registry and authToken', () => {
    const processResult: UnconfigureRegistryOptions = {
      userconfig: 'test-config',
      port: 4873,
      host: 'localhost',
    };

    unconfigureRegistry(processResult);

    expect(execSync).toHaveBeenCalledTimes(2);
    expect(execSync).toHaveBeenCalledWith(
      'npm config delete registry --userconfig="test-config"'
    );

    expect(execSync).toHaveBeenCalledWith(
      'npm config delete //localhost:4873/:_authToken --userconfig="test-config"'
    );
  });

  it('should delete and log registry and authToken commands if verbose is true', () => {
    const processResult: UnconfigureRegistryOptions = {
      userconfig: 'test-config',
      port: 4873,
      host: 'localhost',
    };

    unconfigureRegistry(processResult, true);

    expect(execSync).toHaveBeenCalledTimes(2);
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

  it('should create npm workspace in given folder', () => {
    setupNpmWorkspace('tmp');
    expect(chdirSpy).toHaveBeenCalledTimes(1);
    expect(chdirSpy).toHaveBeenCalledWith('tmp');
    expect(consoleInfoSpy).not.toHaveBeenCalled();
  });

  it('should call infoLog if verbose is given', () => {
    setupNpmWorkspace('tmp', true);
    expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      `${red('>')} ${red(bold('Npm Env: '))} Execute: npm init in directory tmp`
    );
  });
});
