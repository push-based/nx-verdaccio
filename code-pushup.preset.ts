import coveragePlugin, {
  getNxCoveragePaths,
} from '@code-pushup/coverage-plugin';
import eslintPlugin, {
  eslintConfigFromAllNxProjects,
  eslintConfigFromNxProject,
} from '@code-pushup/eslint-plugin';
import jsPackagesPlugin from '@code-pushup/js-packages-plugin';
import type { CategoryConfig, CoreConfig } from '@code-pushup/models';

export const jsPackagesCategories: CategoryConfig[] = [
  {
    slug: 'security',
    title: 'Security',
    description: 'Finds known **vulnerabilities** in 3rd-party packages.',
    refs: [
      {
        type: 'group',
        plugin: 'js-packages',
        slug: 'npm-audit',
        weight: 1,
      },
    ],
  },
  {
    slug: 'updates',
    title: 'Updates',
    description: 'Finds **outdated** 3rd-party packages.',
    refs: [
      {
        type: 'group',
        plugin: 'js-packages',
        slug: 'npm-outdated',
        weight: 1,
      },
    ],
  },
];

export const eslintCategories: CategoryConfig[] = [
  {
    slug: 'bug-prevention',
    title: 'Bug prevention',
    description: 'Lint rules that find **potential bugs** in your code.',
    refs: [{ type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 }],
  },
  {
    slug: 'code-style',
    title: 'Code style',
    description:
      'Lint rules that promote **good practices** and consistency in your code.',
    refs: [{ type: 'group', plugin: 'eslint', slug: 'suggestions', weight: 1 }],
  },
];

export const coverageCategories: CategoryConfig[] = [
  {
    slug: 'code-coverage',
    title: 'Code coverage',
    description: 'Measures how much of your code is **covered by tests**.',
    refs: [
      {
        type: 'group',
        plugin: 'coverage',
        slug: 'coverage',
        weight: 1,
      },
    ],
  },
];

export const jsPackagesCoreConfig = async (): Promise<CoreConfig> => {
  return {
    plugins: [await jsPackagesPlugin()],
    categories: jsPackagesCategories,
  };
};

export const lighthouseCoreConfig = async (
  url: string
): Promise<CoreConfig> => {
  return {
    plugins: [await lighthousePlugin(url)],
    categories: lighthouseCategories,
  };
};

export const eslintCoreConfigNx = async (
  projectName?: string
): Promise<CoreConfig> => {
  return {
    plugins: [
      await eslintPlugin(
        projectName
          ? [await eslintConfigFromNxProject(projectName)]
          : await eslintConfigFromAllNxProjects()
      ),
    ],
    categories: eslintCategories,
  };
};

export const coverageCoreConfigNx = async (
  projectName?: string[]
): Promise<CoreConfig> => {
  const targetNames = ['unit-test', 'integration-test'];
  const targetArgs = [
    '-t',
    'unit-test',
    'integration-test',
    '--coverage.enabled',
    '--skipNxCache',
  ];
  return {
    plugins: [
      await coveragePlugin({
        coverageToolCommand: {
          command: 'npx',
          args: [
            'nx',
            projectName
              ? `run-many --projects ${projectName.join(' ')}`
              : 'run',
            ...targetArgs
          ],
        },
        reports: [
          'coverage/projects/unit/nx-verdaccio/lcov.info',
          'coverage/projects/integration/nx-verdaccio/lcov.info',
        ],
      }),
    ],
    categories: coverageCategories,
  };
};
