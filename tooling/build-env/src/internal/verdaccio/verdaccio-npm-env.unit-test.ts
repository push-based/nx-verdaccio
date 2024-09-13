import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureRegistry, verdaccioEnvLogger } from './verdaccio-npm-env';
import { bold, gray, red } from 'ansis';
import { execSync } from 'node:child_process';
import { objectToCliArgs } from '../utils/terminal';
import type { VerdaccioProcessResult } from './verdaccio-registry';

describe('verdaccioEnvLogger.info', () => {
  let consoleInfoSpy;
  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(vi.fn());
  });

  it('should log info', () => {
    verdaccioEnvLogger.info('message');
    expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      `${gray('>')} ${gray(bold('Verdaccio Env: '))} ${'message'}`
    );
  });
});

describe('logError', () => {
  let consoleErrorSpy;
  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
  });

  it('should log error', () => {
    verdaccioEnvLogger.error('message');
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `${red('>')} ${red(bold('Verdaccio Env: '))} ${'message'}`
    );
  });
});

describe('configureRegistry', () => {
  it('should set the npm registry and authToken', () => {
    const processResult: VerdaccioProcessResult & { userconfig?: string } = {
      port: 4873,
      host: 'localhost',
      protocol: 'http',
      url: 'http://localhost:4873',
      userconfig: 'test-config',
    };

    configureRegistry(processResult, false);

    expect(objectToCliArgs).toHaveBeenCalledWith({ userconfig: 'test-config' });

    expect(execSync).toHaveBeenCalledWith(
      'npm config set registry="http://localhost:4873" --userconfig=test-config'
    );

    expect(execSync).toHaveBeenCalledWith(
      'npm config set //localhost:4873/:_authToken "secretVerdaccioToken" --userconfig=test-config'
    );
  });

  it('should log registry and authToken commands if verbose is true', () => {
    const processResult = {
      port: 4873,
      host: 'localhost',
      url: 'http://localhost:4873',
      userconfig: 'test-config',
    };

    configureRegistry(processResult, true);

    expect(verdaccioEnvLogger.info).toHaveBeenCalledWith(
      'Set registry:\nnpm config set registry="http://localhost:4873" --userconfig=test-config'
    );

    expect(verdaccioEnvLogger.info).toHaveBeenCalledWith(
      'Set authToken:\nnpm config set //localhost:4873/:_authToken "secretVerdaccioToken" --userconfig=test-config'
    );

    expect(execSync).toHaveBeenCalledTimes(2);
  });
});
