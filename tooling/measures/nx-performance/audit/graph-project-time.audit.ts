import { AuditOutput } from '@code-pushup/models';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

export const DEFAULT_MAX_PROJECT_GRAPH_TIME = 300;
export const PROJECT_GRAPH_PERFORMANCE_AUDIT_SLUG = 'graph-time-project';
export const PROJECT_GRAPH_PERFORMANCE_AUDIT = {
  slug: PROJECT_GRAPH_PERFORMANCE_AUDIT_SLUG,
  title: '[Graph Time] project graph',
  description: 'An audit to check performance of the Nx project graph',
};

export type ProjectGraphAuditOptions = {
  maxProjectGraphTime?: number;
};

export async function graphProjectTimeAudit(
  options?: ProjectGraphAuditOptions
): Promise<AuditOutput> {
  const { maxProjectGraphTime = DEFAULT_MAX_PROJECT_GRAPH_TIME } =
    options ?? {};
  const { duration } = await projectGraphTiming();

  return {
    slug: PROJECT_GRAPH_PERFORMANCE_AUDIT_SLUG,
    score: scoreProjectGraphDuration(duration, maxProjectGraphTime),
    value: duration,
    displayValue: `${duration.toFixed(2)} ms`,
    details: {},
  };
}

export function scoreProjectGraphDuration(
  duration: number,
  maxDuration: number
): number {
  // Ensure duration is capped at maxDuration for the scoring
  if (duration >= maxDuration) return 0;

  // A simple linear score where a lower duration gives a higher score.
  // When duration == 0, score is 1 (perfect). When duration == maxDuration, score is 0 (poor).
  return 1 - duration / maxDuration;
}

export async function projectGraphTiming(): Promise<{ duration: number }> {
  const start = performance.now();
  const isWindows = process.platform === 'win32';
  await promisify(execFile)('npx', ['nx', 'show', 'projects'], {
    shell: isWindows,
    env: {
      ...process.env,
      NX_CACHE_PROJECT_GRAPH: 'false',
      NX_ISOLATE_PLUGINS: 'true',
      NX_DAEMON: 'false',
    },
  });

  const execFileDuration = Number((performance.now() - start).toFixed(3));
  return { duration: Number(execFileDuration.toFixed(3)) };
}
