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
const taskGraphTasks = ['cli-e2e:install-env'];
const taskTimeTasks = [
  'cli-e2e:e2e',
  'cli-e2e:setup-env',
  'cli:unit-test',
  'cli:build',
  'core-e2e:e2e',
  'utils-e2e:e2e',
  'models-e2e:e2e',
  'cli-e2e-original:original-e2e',
];
const cacheSizeTasks = [
  'models-e2e:setup-env',
  'utils-e2e:setup-env',
  'core-e2e:setup-env',
  'cli-e2e:setup-env',
  'playground-e2e:setup-env',
];
export default {
  plugins: [
    nxPerformancePlugin({
      taskTimeTasks,
      taskGraphTasks,
      maxTaskTime: 60 * 1000 * 1.5,
      cacheSizeTasks,
      // 250MB
      maxCacheSize: 382_730_240,
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
