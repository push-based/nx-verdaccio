import { describe, it, expect } from 'vitest';
import { parseRegistryData, startVerdaccioServer } from './verdaccio-registry';
import { executeProcess } from '../../internal/execute-process';
import { ChildProcess } from 'node:child_process';
import { logger } from '@nx/devkit';

vi.mock('../../internal/execute-process');

vi.mock('@nx/devkit', async () => {
  const actual = await vi.importActual('@nx/devkit');
  return {
    ...actual,
    logger: {
      info: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('parseRegistryData', () => {
  it('should correctly parse protocol host and port from stdout', () => {
    const stdout =
      'warn --- http address - http://localhost:4873/ - verdaccio/5.31.1';
    const result = parseRegistryData(stdout);

    expect(result).toEqual({
      protocol: 'http',
      host: 'localhost',
      port: 4873,
      url: 'http://localhost:4873',
    });
  });

  it('should correctly parse https protocol', () => {
    const stdout =
      'warn --- http address - https://localhost:4873/ - verdaccio/5.31.1';
    const result = parseRegistryData(stdout);

    expect(result.protocol).toEqual('https');
  });

  it('should throw an error if the protocol is invalid', () => {
    const stdout = 'ftp://localhost:4873'; // Invalid protocol
    expect(() => parseRegistryData(stdout)).toThrowError(
      'Could not parse registry data from stdout'
    );
  });

  it('should throw an error if the host is missing', () => {
    const stdout = 'http://:4873'; // Missing host
    expect(() => parseRegistryData(stdout)).toThrowError(
      'Could not parse registry data from stdout'
    );
  });

  it('should throw an error if the stdout is empty', () => {
    const stdout = ''; // Empty output
    expect(() => parseRegistryData(stdout)).toThrowError(
      'Could not parse registry data from stdout'
    );
  });

  it('should throw an error if the port is missing', () => {
    const stdout = 'http://localhost:'; // Missing port
    expect(() => parseRegistryData(stdout)).toThrowError(
      'Could not parse registry data from stdout'
    );
  });
});

describe('startVerdaccioServer', () => {
  it('should start the server and return correct registry result', async () => {
    const mockStdout = 'http://localhost:4873 - verdaccio/5.31.1';

    const mockChildProcess = { pid: 12345 } as ChildProcess;

    vi.mocked(executeProcess).mockImplementation(({ observer }) => {
      observer.onStdout(mockStdout, mockChildProcess);
      return Promise.resolve({
        stdout: mockStdout,
        stderr: '',
        code: 0,
        date: '',
        duration: 0,
      });
    });

    const result = await startVerdaccioServer({
      projectName: 'test-project',
    });

    expect(result).toEqual({
      registry: {
        pid: 12345,
        storage: expect.any(String),
        protocol: 'http',
        host: 'localhost',
        port: 4873,
        url: 'http://localhost:4873',
      },
      stop: expect.any(Function),
    });

    expect(result.registry.pid).toBe(12345);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Registry started on URL')
    );
  });

  it('should handle errors during process execution', async () => {
    const mockError = new Error('Execution failed');
    vi.mocked(executeProcess).mockImplementation(() => {
      throw mockError;
    });

    await expect(
      startVerdaccioServer({
        projectName: 'test-project',
      })
    ).rejects.toThrow('Execution failed');

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Execution failed')
    );
  });
});
