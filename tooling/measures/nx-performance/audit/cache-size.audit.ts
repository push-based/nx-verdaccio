import {Audit, AuditOutput} from '@code-pushup/models';
import {crawlFileSystem, executeProcess, formatBytes, slugify,} from '@code-pushup/utils';
import {logger} from '@nx/devkit';
import {join} from 'node:path';
import {DEFAULT_PLUGIN_OUTPUT} from '../constant';
import {stat} from "node:fs/promises";

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
  const sizes: Record<string, number>[] = await projectTaskCacheSizeIssues(
    cacheSizeTasks
  );

  return (
    sizes
      // [{task-cache-a:size}, {task-cache-b:size}] -> [[task-cache-a, size], [task-cache-b, size]]
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

export async function projectTaskCacheSizeIssues<T extends string>(
  tasks: T[]
): Promise<Record<string, number>[]> {
  let results: Record<string, number>[] = [];

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
    results.push({[task]: await folderSize({directory: environmentRoot})});
  }
  return results;
}

export async function folderSize(options: {
  directory: string;
  pattern?: string | RegExp;
  budget?: number;
}): Promise<number> {
  const {directory, pattern, budget} = options;
  const fileSizes = await crawlFileSystem({
    directory,
    pattern,
    fileTransform: async (file: string): Promise<number> => {
      const stats = await stat(file);
      return stats.size;
    },
  });
  return fileSizes.reduce((sum, size) => sum + size, 0);
}
