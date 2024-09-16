import { AuditOutput, Audit } from '@code-pushup/models';
import {
  executeProcess,
  slugify,
  formatDuration,
  formatBytes,
} from '@code-pushup/utils';
import { logger } from '@nx/devkit';
import { join } from 'node:path';
import { DEFAULT_PLUGIN_OUTPUT } from '../constant';

export const DEFAULT_MAX_PROJECT_TARGET_CACHE_SIZE = 3000;

export const CACHE_SIZE_AUDIT_POSTFIX = 'cache-size';

export function getCacheSizeAuditSlug(task: string): string {
  return `nx-${slugify(task)}-${CACHE_SIZE_AUDIT_POSTFIX}`;
}

export const getCacheSizeAudits = (tasks: string[]): Audit[] => {
  return tasks.map((task) => ({
    slug: getCacheSizeAuditSlug(task), // Unique slug for each task
    title: `Cache size ${task}`,
    description: 'An audit to check cache size of the Nx task.',
  }));
};

export type CacheSizeAuditOptions = {
  cacheSizeTasks: string[];
  maxCacheSize?: number;
};

export async function cacheSizeAudits(
  options?: CacheSizeAuditOptions
): Promise<AuditOutput[]> {
  const {
    cacheSizeTasks,
    maxCacheSize = DEFAULT_MAX_PROJECT_TARGET_CACHE_SIZE,
  } = options ?? {};

  // Get the timings for each task
  const timings: Record<string, number>[] = await projectTaskCacheSize(
    cacheSizeTasks
  );

  // Return an array of audits, one per task
  return (
    timings
      // [{task-a:duration}, {task-b:duration}] -> [[task-a, duration], [task-b, duration]]
      .map((allTaskTimes): [string, number] => {
        const allTaskEntries = Object.entries(allTaskTimes);
        return [
          allTaskEntries?.at(-1)?.at(0) as string, // Get the last task name
          allTaskEntries.reduce((acc, [task, duration]) => acc + duration, 0),
        ];
      })
      .map(([task, duration]) => ({
        slug: getCacheSizeAuditSlug(task), // Unique slug for each task
        score: scoreProjectTaskCacheSize(duration, maxCacheSize),
        value: duration,
        displayValue: formatBytes(duration),
        details: {},
      }))
  );
}

export function scoreProjectTaskCacheSize(
  duration: number,
  maxDuration: number
): number {
  // Ensure duration is capped at maxDuration for the scoring
  if (duration >= maxDuration) return 0;

  // A simple linear score where a lower duration gives a higher score.
  // When duration == 0, score is 1 (perfect). When duration == maxDuration, score is 0 (poor).
  return 1 - duration / maxDuration;
}

export async function projectTaskCacheSize<T extends string>(
  tasks: T[]
): Promise<Record<T, number>[]> {
  const results: Record<T, number>[] = [];

  for (const task of tasks) {
    const environmentRoot = join('.',
      DEFAULT_PLUGIN_OUTPUT,
      'cache-size',
      slugify(task)
    );
    await executeProcess({
      command: `npx`,
      args: [
        'nx',
        'run',
        task,
        '--parallel=1',
        `--environmentRoot=${environmentRoot}`,
        '--verbose',
      ],
      observer: {
        onStdout: (stdout) => logger.info(stdout),
        onStderr: (stderr) => logger.error(stderr),
      },
    });

    const { stdout } = await executeProcess({
      command: 'du',
      args: ['-sk', join(process.cwd(),environmentRoot), '|', 'awk', "'{print $1 * 1024}'"],
      observer: {
        onStdout: (stdout) => logger.info(stdout),
        onStderr: (stderr) => logger.error(stderr),
      },
    });
    results.push({ [task]: parseInt(stdout) } as Record<T, number>);
  }
  return results;
}
