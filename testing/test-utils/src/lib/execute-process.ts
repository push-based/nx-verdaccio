import {
  type ChildProcess,
  type ChildProcessByStdio,
  type SpawnOptionsWithStdioTuple,
  type StdioPipe,
  spawn,
} from 'node:child_process';
import type { Readable, Writable } from 'node:stream';

export type ProcessResult = {
  stdout: string;
  stderr: string;
  code: number | null;
  date: string;
  duration: number;
};

export class ProcessError extends Error {
  code: number | null;
  stderr: string;
  stdout: string;

  constructor(result: ProcessResult) {
    super(result.stderr);
    this.code = result.code;
    this.stderr = result.stderr;
    this.stdout = result.stdout;
  }
}

export type ProcessConfig = Omit<
  SpawnOptionsWithStdioTuple<StdioPipe, StdioPipe, StdioPipe>,
  'stdio'
> & {
  command: string;
  args?: string[];
  observer?: ProcessObserver;
  ignoreExitCode?: boolean;
};

export type ProcessObserver = {
  onStdout?: (stdout: string, sourceProcess?: ChildProcess) => void;
  onStderr?: (stderr: string, sourceProcess?: ChildProcess) => void;
  onError?: (error: ProcessError) => void;
  onComplete?: () => void;
};

export function executeProcess(cfg: ProcessConfig): Promise<ProcessResult> {
  const { command, args, observer, ignoreExitCode = false, ...options } = cfg;
  const { onStdout, onStderr, onError, onComplete } = observer ?? {};
  const date = new Date().toISOString();
  const start = performance.now();

  return new Promise((resolve, reject) => {
    // shell:true tells Windows to use shell command for spawning a child process
    const spawnedProcess = spawn(command, args ?? [], {
      shell: true,
      ...options,
    }) as ChildProcessByStdio<Writable, Readable, Readable>;

    let stdout = '';
    let stderr = '';

    spawnedProcess.stdout.on('data', data => {
      stdout += String(data);
      onStdout?.(String(data), spawnedProcess);
    });

    spawnedProcess.stderr.on('data', data => {
      stderr += String(data);
      onStderr?.(String(data), spawnedProcess);
    });

    spawnedProcess.on('error', err => {
      stderr += err.toString();
    });

    spawnedProcess.on('close', code => {
      const timings = { date, duration: performance.now() - start };
      if (code === 0 || ignoreExitCode) {
        onComplete?.();
        resolve({ code, stdout, stderr, ...timings });
      } else {
        const errorMsg = new ProcessError({ code, stdout, stderr, ...timings });
        onError?.(errorMsg);
        reject(errorMsg);
      }
    });
  });
}
