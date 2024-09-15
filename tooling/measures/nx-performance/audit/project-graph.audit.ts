import {AuditOutput, PluginReport} from "@code-pushup/models";
import {execFile} from "node:child_process";

export const DEFAULT_MAX_PROJECT_GRAPH_TIME = 300;

export const PROJECT_GRAPH_PERFORMANCE_AUDIT = {
  slug: 'project-graph-performance',
  title: 'Nx project graph performance audit',
  description: 'An audit to check performance of the Nx project graph',
}

export type ProjectGraphAuditOptions = {
  maxDuration?: number;
}

export async function projectGraphAudit(options?: ProjectGraphAuditOptions): Promise<AuditOutput> {
  const {maxDuration = DEFAULT_MAX_PROJECT_GRAPH_TIME} = options ?? {};
  const {duration} = await projectGraphTiming();

  return {
    slug: 'project-graph-performance',
    score: scoreProjectGraphDuration(duration, maxDuration),
    value: duration,
    displayValue: `${duration.toFixed(2)} ms`,
    details: {}
  };
}


export function scoreProjectGraphDuration(duration: number, maxDuration: number): number {
  // Ensure duration is capped at maxDuration for the scoring
  if (duration >= maxDuration) return 0;

  // A simple linear score where a lower duration gives a higher score.
  // When duration == 0, score is 1 (perfect). When duration == maxDuration, score is 0 (poor).
  return 1 - duration / maxDuration;
}

export async function projectGraphTiming(): Promise<{ duration: number }> {
  const start = performance.now();
  await execFile('npx nx show projects');
  return {duration: Number((performance.now() - start).toFixed(3))};
}
