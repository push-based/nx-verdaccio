import { CoreConfig } from '@code-pushup/models';
import nxPerformancePlugin, {
  nxPerformanceCategoryRefs,
  type OnlyAudit,
} from './tooling/measures/nx-performance/nx-performance.plugin';

const onlyAudits: OnlyAudit[] = [
  'graph-time-project',
  'graph-time-task',
  'cache-size',
  'task-time',
];
const taskGraphTasks = ['cli-e2e:pb-ve-env-install'];
const taskTimeTasks = [
  'cli-e2e:e2e',
  'cli-e2e:pb-v-env-setup',
  'cli:unit-test',
  'cli:build',
  'core-e2e:e2e',
  'utils-e2e:e2e',
  'models-e2e:e2e',
  'cli-e2e-original:original-e2e',
];
const cacheSizeTasks = [
  'models-e2e:pb-ve-env-setup',
  'utils-e2e:pb-ve-env-setup',
  'core-e2e:pb-ve-env-setup',
  'cli-e2e:pb-ve-env-setup',
  'playground-e2e:pb-ve-env-setup',
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
