import {CoreConfig} from '@code-pushup/models';
import nxPerformancePlugin, {
  nxPerformanceCategoryRefs,
  type OnlyAudit,
} from './tooling/measures/nx-performance/nx-performance.plugin';
import {TaskTimeAuditOption} from './tooling/measures/nx-performance';

const onlyAudits: OnlyAudit[] = [
  'graph-time-project',
  'graph-time-task',
  'cache-size',
  'task-time',
];
const taskGraphTasks = ['cli-e2e:nxv-env-install'];
const taskTimeTasks: TaskTimeAuditOption[] = [
  {task: 'models-e2e:nxv-env-teardown'},
  {task: 'models-e2e:nxv-env-bootstrap'},
  {task: 'models-e2e:nxv-env-setup'},
  {task: 'models-e2e:e2e'},
  {task: 'models-e2e:nxv-e2e'},
  {task: 'nx-verdaccio-e2e:nxv-e2e'},
  {task: 'cli-e2e-original:original-e2e', options: { exclude: ["nx-verdaccio"]}},
];
const cacheSizeTasks = [
  'models-e2e:nxv-env-setup',
  'nx-verdaccio-e2e:nxv-env-setup',
];
export default {
  plugins: [
    nxPerformancePlugin({
      taskTimeTasks,
      taskGraphTasks,
      // ~ 1 minutes 20 seconds
      maxTaskTime: 60 * 1000 * 1.3,
      cacheSizeTasks,
      // ~ 250MB
      maxCacheSize: 262_144_000,
      onlyAudits,
    }),
  ],
  categories: [
    {
      slug: 'performance',
      title: 'Performance',
      refs: [
        ...nxPerformanceCategoryRefs({
          taskTimeTasks,
          cacheSizeTasks,
          taskGraphTasks,
          onlyAudits,
        }),
      ],
    },
  ],
} satisfies CoreConfig;
