import { describe, it, expect, vi } from 'vitest';
import { killProcessFromFilePath } from './kill-process';
import { logger, readJsonFile } from '@nx/devkit';
import { rm } from 'node:fs/promises';

vi.mock('@nx/devkit', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
  readJsonFile: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  rm: vi.fn(),
}));

describe('killProcessFromPid', () => {
  const processKillSpy = vi.spyOn(process, 'kill').mockImplementation(vi.fn());

  it('should kill the process if pid is found and dryRun is false', async () => {
    vi.mocked(readJsonFile).mockReturnValue({ pid: 1234 });

    await killProcessFromFilePath('path/to/file', { dryRun: false });

    expect(processKillSpy).toHaveBeenCalledWith(1234);
    expect(rm).toHaveBeenCalledWith('path/to/file');
  });

  it('should not kill the process if dryRun is true but log a warning', async () => {
    vi.mocked(readJsonFile).mockReturnValue({ pid: 1234 });

    await killProcessFromFilePath('path/to/file', {
      dryRun: true,
      verbose: true,
    });

    expect(processKillSpy).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      'Would kill process with id: 1234. But dryRun is enabled.'
    );
    expect(rm).toHaveBeenCalledWith('path/to/file');
  });

  it('should throw an error if the file could not be read', async () => {
    vi.mocked(readJsonFile).mockImplementation(() => {
      throw new Error('File not found');
    });

    await expect(killProcessFromFilePath('path/to/file')).rejects.toThrowError(
      'Could not load path/to/file to get pid'
    );
    expect(processKillSpy).not.toHaveBeenCalled();
    expect(rm).not.toHaveBeenCalled();
  });

  it('should throw an error if pid is not found in the file', async () => {
    vi.mocked(readJsonFile).mockReturnValue({});

    await expect(killProcessFromFilePath('path/to/file')).rejects.toThrowError(
      'no pid found in file path/to/file'
    );
    expect(processKillSpy).not.toHaveBeenCalled();
    expect(rm).not.toHaveBeenCalled();
  });

  it('should log an error if killing the process fails', async () => {
    vi.mocked(readJsonFile).mockReturnValue({ pid: 1234 });
    // Mock process.kill to throw an error
    vi.spyOn(process, 'kill').mockImplementation(() => {
      throw new Error('Failed to kill process');
    });

    await killProcessFromFilePath('path/to/file', { dryRun: false });

    expect(logger.error).toHaveBeenCalledWith(
      'Failed killing process with id: 1234\nError: Failed to kill process'
    );
    expect(rm).toHaveBeenCalledWith('path/to/file');
  });
});
