import { AuditOutput, Audit } from '@code-pushup/models';
import { executeProcess, slugify, formatDuration } from '@code-pushup/utils';
import { logger, readJsonFile } from '@nx/devkit';
import { DEFAULT_PLUGIN_OUTPUT } from '../constant';
import { join } from 'node:path';

export const DEFAULT_MAX_PROJECT_TARGET_TIME = 300;

export const TASK_TIME_AUDIT_POSTFIX = 'task-time';

export function getTaskTimeAuditSlug(task: string): string {
  return `nx-${slugify(task)}-${TASK_TIME_AUDIT_POSTFIX}`;
}

export const getTaskTimeAudits = (tasks: string[]): Audit[] => {
  return tasks.map((task) => ({
    slug: getTaskTimeAuditSlug(task), // Unique slug for each task
    title: `Task time ${task}`,
    description: 'An audit to check performance of the Nx task.',
  }));
};

export type ProjectTaskAuditOptions = {
  taskTimeTasks: string[];
  maxTaskTime?: number;
};

export async function taskTimeAudits(
  options?: ProjectTaskAuditOptions
): Promise<AuditOutput[]> {
  const { taskTimeTasks, maxTaskTime = DEFAULT_MAX_PROJECT_TARGET_TIME } =
    options ?? {};

  // Get the timings for each task
  const timings: Record<string, number>[] = await projectTaskTiming(
    taskTimeTasks
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
        slug: getTaskTimeAuditSlug(task), // Unique slug for each task
        score: scoreProjectTaskDuration(duration, maxTaskTime),
        value: duration,
        displayValue: formatDuration(duration),
        details: {},
      }))
  );
}

export function scoreProjectTaskDuration(
  duration: number,
  maxDuration: number
): number {
  // Ensure duration is capped at maxDuration for the scoring
  if (duration >= maxDuration) return 0;

  // A simple linear score where a lower duration gives a higher score.
  // When duration == 0, score is 1 (perfect). When duration == maxDuration, score is 0 (poor).
  return 1 - duration / maxDuration;
}

export async function projectTaskTiming<T extends string>(
  tasks: T[]
): Promise<Record<T, number>[]> {
  const results: Record<T, number>[] = [];

  for (const task of tasks) {
    const dist = join(DEFAULT_PLUGIN_OUTPUT, 'task-time');
    await executeProcess({
      command: `NX_PERF_LOGGING=true NX_DAEMON=false NX_PROFILE=${dist}/${slugify(
        task
      )}-profile.json npx`,
      args: ['nx', 'run', task, '--parallel=1', '--verbose', '--skipNxCache'],
      observer: {
        onStdout: (stdout) => logger.info(stdout),
        onStderr: (stderr) => logger.error(stderr),
      },
    });

    const taskPerfJson = readJsonFile(`${dist}/${slugify(task)}-profile.json`);
    results.push(
      taskPerfJson
        .filter(
          ({ args }) =>
            args.target &&
            `${args.target.project}:${args.target.target}` === task
        )
        .map(({ args, dur }) => {
          return {
            [`${args.target.project}:${args.target.target}`]: dur / 1000,
          };
        })
        .at(0)
    );
  }
  return results;
}
