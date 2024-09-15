import { PluginConfig, AuditOutputs, CategoryRef } from '@code-pushup/models';
import { PLUGIN_SLUG } from './constant';
import {
  PROJECT_GRAPH_PERFORMANCE_AUDIT,
  projectGraphAudit,
  ProjectGraphAuditOptions,
} from './audit/project-graph.audit';
import {
  getTaskPerformanceAudits,
  ProjectTaskAuditOptions,
  taskTimeAudits,
} from './audit/project-task.audit';
import {
  CacheSizeAuditOptions,
  cacheSizeAudits,
  getCacheSizeAudits,
} from './audit/cache-size.audit';

export const nxPerformanceAudits = ({
  taskTimeTasks,
  cacheSizeTasks,
}: NxPerfPluginConfig) => [
  PROJECT_GRAPH_PERFORMANCE_AUDIT,
  ...(taskTimeTasks ? getTaskPerformanceAudits(taskTimeTasks) : []),
  ...(cacheSizeTasks ? getCacheSizeAudits(cacheSizeTasks) : []),
];

export const nxPerformanceCategoryRefs = (options: NxPerfRunnerOptions): CategoryRef[] =>
  nxPerformanceAudits(options).map(({ slug }) => ({
    type: 'audit',
    plugin: PLUGIN_SLUG,
    slug,
    weight: 1,
  }));

export type NxPerfPluginConfig = ProjectGraphAuditOptions &
  ProjectTaskAuditOptions &
  CacheSizeAuditOptions;

export function nxPerformancePlugin(
  options?: NxPerfPluginConfig
): PluginConfig {
  return {
    slug: PLUGIN_SLUG,
    title: 'Nx Performance Checks',
    icon: 'flash',
    description: 'A plugin to measure and assert performance of Nx workspace.',
    runner: () => runnerFunction(options),
    audits: nxPerformanceAudits(options),
  };
}

export default nxPerformancePlugin;

export type NxPerfRunnerOptions = NxPerfPluginConfig;
export async function runnerFunction(
  options: NxPerfRunnerOptions
): Promise<AuditOutputs> {
  const {
    taskTimeTasks,
    maxTaskTime,
    maxCacheSize,
    cacheSizeTasks,
    maxProjectGraphTime,
  } = options;
  return [
    await projectGraphAudit({ maxProjectGraphTime }),
    ...(await cacheSizeAudits({ maxCacheSize, cacheSizeTasks })),
    ...(await taskTimeAudits({ taskTimeTasks, maxTaskTime })),
  ];
}
