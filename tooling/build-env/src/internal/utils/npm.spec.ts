import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logInfo, logError, setupNpmWorkspace } from './npm';
import { bold, gray, red } from 'ansis';
import { MEMFS_VOLUME } from '@org/test-utils';

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

  beforeEach(() => {
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(MEMFS_VOLUME);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    chdirSpy.mockRestore();
  });

  it('should create npm workspace in given folder', () => {
    setupNpmWorkspace('tmp');
  });
});
