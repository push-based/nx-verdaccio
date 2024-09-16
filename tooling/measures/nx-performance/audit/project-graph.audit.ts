import {AuditOutput, PluginReport} from '@code-pushup/models';
import {execFile} from 'node:child_process';
import {join} from "node:path";
import {DEFAULT_PLUGIN_OUTPUT} from "../constant";
import {executeProcess, slugify} from "@code-pushup/utils";

export const DEFAULT_MAX_PROJECT_GRAPH_TIME = 300;

export const PROJECT_GRAPH_PERFORMANCE_AUDIT = {
  slug: 'project-graph-performance',
  title: 'Project graph performance',
  description: 'An audit to check performance of the Nx project graph',
};

export type ProjectGraphAuditOptions = {
  maxProjectGraphTime?: number;
};

export async function projectGraphAudit(
  options?: ProjectGraphAuditOptions
): Promise<AuditOutput> {
  const {maxProjectGraphTime = DEFAULT_MAX_PROJECT_GRAPH_TIME} =
  options ?? {};
  const {duration} = await projectGraphTiming();

  return {
    slug: 'project-graph-performance',
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
  /*
  Notice: executeProcess has ~500ms overhead compared to execFile
  const {duration} = await executeProcess({
    command: 'npx',
    args: ['nx', 'show', 'projects'],
    env: {
      ...process.env,
      NX_DAEMON: 'false',
      NX_CACHE_PROJECT_GRAPH: 'false',
      NX_ISOLATE_PLUGINS: 'true',
    }
  })*/
  const start = performance.now();
  execFile('NX_DAEMON=true NX_CACHE_PROJECT_GRAPH=false NX_ISOLATE_PLUGINS=true npx nx show projects');
  const execFileDuration = Number((performance.now() - start).toFixed(3));
  return {duration: Number(execFileDuration.toFixed(3))};
}
