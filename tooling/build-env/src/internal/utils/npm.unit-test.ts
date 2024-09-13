import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bold, gray, red } from 'ansis';
import { MEMFS_VOLUME } from '@org/test-utils';
import { logError, logInfo, setupNpmWorkspace } from './npm';

describe('logInfo', () => {
  let consoleInfoSpy;
  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(vi.fn());
  });

  it('should log info', () => {
    logInfo('message');
    expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      `${gray('>')} ${gray(bold('Npm Env: '))} ${'message'}`
    );
  });
});

describe('logError', () => {
  let consoleErrorSpy;
  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
  });

  it('should log error', () => {
    logError('message');
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `${red('>')} ${red(bold('Npm Env: '))} ${'message'}`
    );
  });
});

describe.skip('setupNpmWorkspace', () => {
  let cwdSpy;
  let chdirSpy;
  let logInfoSpy;

  beforeEach(() => {
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(MEMFS_VOLUME);
    chdirSpy = vi.spyOn(process, 'chdir').mockImplementation(vi.fn());
    logInfoSpy = vi.mocked(logInfo).mockImplementation(vi.fn());
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    chdirSpy.mockRestore();
    logInfoSpy.mockRestore();
  });

  it('should create npm workspace in given folder', () => {
    setupNpmWorkspace('tmp');
    expect(chdirSpy).toHaveBeenCalledTimes(1);
    expect(chdirSpy).toHaveBeenCalledWith('tmp');
    expect(logInfoSpy).not.toHaveBeenCalled();
  });

  it('should call infoLog if verbose is given', () => {
    setupNpmWorkspace('tmp', true);
    expect(logInfoSpy).toHaveBeenCalledTimes(1);
    expect(logInfoSpy).toHaveBeenCalledWith(
      `${red('>')} ${red(bold('Npm Env: '))} Execute: npm init in directory tmp`
    );
  });
});
