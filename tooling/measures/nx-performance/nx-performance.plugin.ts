import {PluginConfig, AuditOutputs, CategoryRef} from "@code-pushup/models";
import {PLUGIN_SLUG} from "./constant";
import {
  PROJECT_GRAPH_PERFORMANCE_AUDIT,
  projectGraphAudit,
  ProjectGraphAuditOptions
} from "./audit/project-graph.audit";
import {getTaskPerformanceAudits, ProjectTaskAuditOptions, projectTaskAudits} from "./audit/project-task.audit";

export const nxPerformanceAudits = ({tasks}: {tasks: string[]}) => ([
  PROJECT_GRAPH_PERFORMANCE_AUDIT,
  ...(tasks ? getTaskPerformanceAudits(tasks) : [] )
])

export const nxPerformanceCategoryRefs = (options: {tasks: string[]} ): CategoryRef[] => nxPerformanceAudits(options).map(({ slug }) => ({
  type: 'audit',
  plugin: PLUGIN_SLUG,
  slug,
  weight: 1,
}));

export type NxPerfPluginConfig = ProjectGraphAuditOptions & ProjectTaskAuditOptions;

export function nxPerformancePlugin(options?: NxPerfPluginConfig): PluginConfig {

  return {
    slug: PLUGIN_SLUG,
    title: 'Nx Performance Checks',
    icon: 'flash',
    description: 'A plugin to measure and assert performance of Nx workspace.',
    runner: () => runnerFunction(options),
    audits: nxPerformanceAudits(options)
  };
}

export default nxPerformancePlugin;

export type NxPerfRunnerOptions = NxPerfPluginConfig;
export async function runnerFunction(
  options: NxPerfRunnerOptions,
): Promise<AuditOutputs> {
  return [
    await projectGraphAudit(options),
    ...(await projectTaskAudits(options))
  ];
}
