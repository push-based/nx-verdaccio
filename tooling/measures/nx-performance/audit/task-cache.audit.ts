import {
  Audit,
  AuditOutput,
  Table,
  Issue,
  TableRowObject,
} from '@code-pushup/models';
import {
  crawlFileSystem,
  executeProcess,
  formatBytes,
  slugify,
} from '@code-pushup/utils';
import { logger } from '@nx/devkit';
import { join } from 'node:path';
import { DEFAULT_PLUGIN_OUTPUT } from '../constant';
import { stat } from 'node:fs/promises';
import { relative } from 'node:path';

export const DEFAULT_MAX_PROJECT_TARGET_CACHE_SIZE = 3000;
export const CACHE_SIZE_AUDIT_POSTFIX = 'cache-size';

export function getCacheSizeAuditSlug(task: string): string {
  return `nx-${slugify(task)}-${CACHE_SIZE_AUDIT_POSTFIX}`;
}

export const getCacheSizeAudits = (tasks: string[]): Audit[] => {
  return tasks.map((task) => ({
    slug: getCacheSizeAuditSlug(task), // Unique slug for each task
    title: `[Cache Size] ${task}`,
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
    cacheSizeTasks = [],
    maxCacheSize = DEFAULT_MAX_PROJECT_TARGET_CACHE_SIZE,
  } = options ?? {};

  const cacheSizeResults = await projectTaskCacheSizeData(cacheSizeTasks);
  return cacheSizeResults.map(
    ({ cacheSize, data, task, issues }): AuditOutput => {
      const { rows, ...restTable } = data;

      return {
        slug: getCacheSizeAuditSlug(task),
        score: scoreProjectTaskCacheSize(cacheSize, maxCacheSize),
        value: cacheSize,
        displayValue: formatBytes(cacheSize),
        details: {
          table: {
            ...restTable,
            rows: prepareFileEntries(rows as FileSizeEntry[], {
              maxFiles: 30,
            }) as TableRowObject[],
          },
          issues,
        },
      };
    }
  );
}

export function prepareFileEntries(
  rows: FileSizeEntry[],
  options: {
    maxFiles?: number;
  } = {}
): (Omit<FileSizeEntry, 'size'> & { size: string })[] {
  const { maxFiles = 10 } = options;
  const topSizes = rows
    .sort((a, b) => b.size - a.size)
    .slice(0, maxFiles)
    .map(({ file, size }) => ({
      file,
      size: formatBytes(size),
    }));

  if (maxFiles >= rows.length) {
    return topSizes;
  }
  return [
    ...topSizes,
    { file: `and ${rows.length - maxFiles} more...`, size: '...' },
  ];
}

export function scoreProjectTaskCacheSize(
  size: number,
  maxSize: number
): number {
  // Ensure size is capped at maxSize for the scoring
  if (size >= maxSize) return 0;

  // A simple linear score where a lower duration gives a higher score.
  // When size == 0, score is 1 (perfect). When duration == maxSize, score is 0 (poor).
  return 1 - size / maxSize;
}

export type CacheSizeResult = {
  task: string;
  target: string;
  project: string;
  cacheSize: number;
  data: Table;
  issues?: Issue[];
};

export async function projectTaskCacheSizeData<T extends string>(
  tasks: T[]
): Promise<CacheSizeResult[]> {
  let results: CacheSizeResult[] = [];

  for (const task of tasks) {
    const environmentRoot = join(
      '.',
      DEFAULT_PLUGIN_OUTPUT,
      'cache-size',
      slugify(task)
    );
    // output cache
    await executeProcess({
      command: `npx`,
      args: [
        'nx',
        'run',
        task,
        '--parallel=1',
        // @TODO refactor to align with outputPath
        `--environmentRoot=${environmentRoot}`,
      ],
      observer: {
        onStdout: (stdout) => logger.info(stdout),
        onStderr: (stderr) => logger.error(stderr),
      },
    });

    const [project, target] = task.split(':');
    const { folderSize: cacheSize, data } = await folderSize({
      directory: environmentRoot,
    });

    results.push({
      task,
      target,
      project,
      cacheSize,
      data,
    });
  }
  return results;
}

export type FileSizeEntry = {
  file: string;
  size: number;
};

export async function folderSize(options: {
  directory: string;
  pattern?: string | RegExp;
  budget?: number;
}): Promise<{
  folderSize: number;
  data: Table;
}> {
  const { directory, pattern, budget } = options;
  const fileSizes = await crawlFileSystem({
    directory,
    pattern,
    fileTransform: async (
      file: string
    ): Promise<{
      file: string;
      size: number;
    }> => {
      const stats = await stat(file);
      return { file: relative(directory, file), size: stats.size };
    },
  });

  return {
    folderSize: fileSizes.reduce((acc, { size }) => acc + size, 0),
    data: {
      title: `File sizes of ${directory}`,
      columns: [
        {
          key: 'file',
          label: 'File',
        },
        {
          key: 'size',
          label: 'Size',
        },
      ],
      rows: fileSizes.map(({ file, size }) => ({
        file,
        size,
      })) satisfies FileSizeEntry[],
    },
  };
}
