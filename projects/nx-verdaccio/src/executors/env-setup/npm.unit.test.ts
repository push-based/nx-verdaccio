import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bold, red } from 'ansis';
import { MEMFS_VOLUME } from '@push-based/test-utils';
import { setupNpmWorkspace } from '../env-setup/npm';

vi.mock('@nx/devkit', async () => {
  const actual = await vi.importActual('@nx/devkit');
  return {
    ...actual,
    logger: {
      info: vi.fn(),
    },
  };
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
