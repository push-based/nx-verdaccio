import {PluginConfig,} from '@code-pushup/models';
import {PLUGIN_SLUG} from './constant';
import {PROJECT_GRAPH_PERFORMANCE_AUDIT, PROJECT_GRAPH_PERFORMANCE_AUDIT_SLUG, projectGraphAudit, ProjectGraphAuditOptions} from './project-graph.audit';

export function nxPerformancePlugin(
  options?: ProjectGraphAuditOptions
): PluginConfig {
  return {
    slug: PLUGIN_SLUG,
    title: 'Nx Performance Checks',
    icon: 'flash',
    description: 'A plugin to measure and assert performance of Nx workspace.',
    runner: async () => {
      const duration = 400;
      return [
        {
          slug: PROJECT_GRAPH_PERFORMANCE_AUDIT_SLUG,
          score: duration < options.maxProjectGraphTime ? 1 : 0,
          value: 0,
        }
        // await projectGraphAudit(options)
      ];
    },
    audits: [
      PROJECT_GRAPH_PERFORMANCE_AUDIT
    ],
  };
}

export default nxPerformancePlugin;
