import { describe, expect, it, vi } from 'vitest';
import {
  bootstrapEnvironment,
  configureRegistry,
  ConfigureRegistryOptions,
  unconfigureRegistry,
  UnconfigureRegistryOptions,
  VERDACCIO_ENV_TOKEN,
} from './verdaccio-npm-env';
import { execSync } from 'node:child_process';
import { logger } from '@nx/devkit';
import { formatInfo } from '../../internal/utils/logging';

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
