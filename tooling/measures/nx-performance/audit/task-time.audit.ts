import { AuditOutput, Audit, Table, Issue } from '@code-pushup/models';
import {
  executeProcess,
  slugify,
  formatDuration,
} from '@code-pushup/utils';
import { logger, readJsonFile } from '@nx/devkit';
import { DEFAULT_PLUGIN_OUTPUT } from '../constant';
import { join } from 'node:path';

export const DEFAULT_MAX_PROJECT_TARGET_TIME = 300;

export const TASK_TIME_AUDIT_POSTFIX = 'task-time';

export function getTaskTimeAuditSlug(task: string): string {
  return `nx-${slugify(task)}-${TASK_TIME_AUDIT_POSTFIX}`;
}

export type TaskTimeAuditOption = {
  task: string;
  cleanup?: () => void | Promise<void>;
}

export const getTaskTimeAudits = (tasks: TaskTimeAuditOption[]): Audit[] => {
  return tasks.map(({task}) => {
    return ({
      slug: getTaskTimeAuditSlug(task), // Unique slug for each task
      title: `[Task Time] ${task}`,
      description: 'An audit to check performance of the Nx task.',
    })
  });
};

export type TaskTimeAuditOptions = {
  taskTimeTasks: TaskTimeAuditOption[];
  maxTaskTime?: number;
};

export async function taskTimeAudits(
  options?: TaskTimeAuditOptions
): Promise<AuditOutput[]> {
  const { taskTimeTasks = [], maxTaskTime = DEFAULT_MAX_PROJECT_TARGET_TIME } =
    options ?? {};

  // Get the timings for each task
  const timings = await taskTimeData(taskTimeTasks);

  // Return an array of audits, one per task
  return timings.map(({ task, taskTime, data, issues }) => ({
    slug: getTaskTimeAuditSlug(task), // Unique slug for each task
    score: scoreProjectTaskDuration(taskTime, maxTaskTime),
    value: taskTime,
    displayValue: formatDuration(taskTime),
    details: {
      table: data,
      issues,
    },
  }));
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

export type TaskTimeResult = {
  task: string;
  target: string;
  project: string;
  taskTime: number;
  data: Table;
  issues?: Issue[];
};

export async function taskTimeData<T extends TaskTimeAuditOption>(
  tasks: T[]
): Promise<TaskTimeResult[]> {
  const results: TaskTimeResult[] = [];

  for (const {task} of tasks) {
    const dist = join(DEFAULT_PLUGIN_OUTPUT, 'task-time');
    await executeProcess({
      command: `NX_DAEMON=false NX_PROFILE=${dist}/${slugify(
        task
      )}-profile.json npx`,
      args: ['nx', 'run', task, '--parallel=1', '--skipNxCache'],
      observer: {
        onStdout: (stdout) => logger.info(stdout),
        onStderr: (stderr) => logger.error(stderr),
      },
    });

    const rows: {
      task: string;
      duration: number;
    }[] = readJsonFile(`${dist}/${slugify(task)}-profile.json`)
      .filter(({ args }) => args.target)
      .map(({ args, dur }) => {
        return {
          task: `${args.target.project}:${args.target.target}`,
          duration: dur / 1000,
        };
      });

    const { project, target } = task.split(':');
    results.push({
      data: {
        title: `Task time for ${task}`,
        columns: [
          {
            key: 'task',
            label: 'Task',
          },
          {
            key: 'duration',
            label: 'Duration',
          },
        ],
        rows: rows.map(({ task, duration }) => ({
          task,
          duration: formatDuration(duration),
        })),
      },
      task,
      project,
      target,
      taskTime: rows.reduce((acc, { duration }) => acc + duration, 0),
    } satisfies TaskTimeResult);
  }

  return results;
}
