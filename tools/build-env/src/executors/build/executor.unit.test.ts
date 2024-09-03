import { type ExecutorContext, logger } from '@nx/devkit';

import { execSync } from 'node:child_process';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import runBuildExecutor from './executor';

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual('node:child_process');

  return {
    ...actual,

    execSync: vi.fn((command: string) => {
      if (command.includes('THROW_ERROR')) {
        throw new Error(command);
      }
    }),
  };
});

describe('runAutorunExecutor', () => {
  const envSpy = vi.spyOn(process, 'env', 'get');
  const loggerInfoSpy = vi.spyOn(logger, 'info');
  const loggerWarnSpy = vi.spyOn(logger, 'warn');

  beforeEach(() => {
    envSpy.mockReturnValue({});
  });
  afterEach(() => {
    loggerWarnSpy.mockReset();
    loggerInfoSpy.mockReset();
    envSpy.mockReset().mockReturnValue({});
  });

  it('should call execSync with build command and return result', async () => {
    const output = await runBuildExecutor({}, {} as ExecutorContext);
    expect(output.success).toBe(true);
    expect(output.command).toMatch('npx @org/cli build');

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('npx @org/cli build'),
      { cwd: '/test' }
    );
  });

  it('should normalize context', async () => {
    const output = await runBuildExecutor(
      {},
      {
        ...({} as ExecutorContext),
        cwd: 'cwd-form-context',
      }
    );
    expect(output.success).toBe(true);
    expect(output.command).toMatch('utils');

    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('utils'), {
      cwd: 'cwd-form-context',
    });
  });

  it('should process executorOptions', async () => {
    const output = await runBuildExecutor(
      { workspaceRoot: '.' },
      {} as ExecutorContext
    );
    expect(output.success).toBe(true);
    expect(output.command).toMatch('--persist.filename="REPORT"');
  });

  it('should create command from context, options and arguments', async () => {
    envSpy.mockReturnValue({ CP_PROJECT: 'CLI' });
    const output = await runBuildExecutor(
      { workspaceRoot: '.' },
      {} as ExecutorContext
    );
    expect(output.command).toMatch('--persist.filename="REPORT"');
    expect(output.command).toMatch(
      '--persist.format="md" --persist.format="json"'
    );
    expect(output.command).toMatch('--upload.project="CLI"');
  });

  it('should log information if verbose is set', async () => {
    const output = await runBuildExecutor(
      { verbose: true },
      { ...({} as ExecutorContext), cwd: '<CWD>' }
    );

    expect(execSync).toHaveBeenCalledTimes(1);

    expect(output.command).toMatch('--verbose');
    expect(loggerWarnSpy).toHaveBeenCalledTimes(0);
    expect(loggerInfoSpy).toHaveBeenCalledTimes(2);
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Run build executor')
    );
    expect(loggerInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Command: npx @org/cli build')
    );
  });

  it('should log command if dryRun is set', async () => {
    await runBuildExecutor({ dryRun: true }, {} as ExecutorContext);

    expect(loggerInfoSpy).toHaveBeenCalledTimes(0);
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'DryRun execution of: npx @org/cli build --dryRun'
      )
    );
  });
});
