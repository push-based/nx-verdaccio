import {DEFAULT_FLAGS} from 'chrome-launcher/dist/flags.js';
import coveragePlugin, {
  getNxCoveragePaths,
} from '@code-pushup/coverage-plugin';
import eslintPlugin, {
  eslintConfigFromAllNxProjects,
  eslintConfigFromNxProject,
} from '@code-pushup/eslint-plugin';
import jsPackagesPlugin from '@code-pushup/js-packages-plugin';
import lighthousePlugin, {
  lighthouseGroupRef,
} from '@code-pushup/lighthouse-plugin';
import type {CategoryConfig, CoreConfig, UploadConfig} from '@code-pushup/models';

export function getEnvVars(): UploadConfig {
  const {CP_PROJECT: project, CP_SERVER: server, CP_ORGANIZATION: organization, CP_API_KEY: apiKey} = process.env;
  return {
    organization,
    project,
    server,
    apiKey
  }
}

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

export const lighthouseCategories: CategoryConfig[] = [
  {
    slug: 'performance',
    title: 'Performance',
    refs: [lighthouseGroupRef('performance')],
  },
  {
    slug: 'a11y',
    title: 'Accessibility',
    refs: [lighthouseGroupRef('accessibility')],
  },
  {
    slug: 'best-practices',
    title: 'Best Practices',
    refs: [lighthouseGroupRef('best-practices')],
  },
  {
    slug: 'seo',
    title: 'SEO',
    refs: [lighthouseGroupRef('seo')],
  },
];

export const eslintCategories: CategoryConfig[] = [
  {
    slug: 'bug-prevention',
    title: 'Bug prevention',
    description: 'Lint rules that find **potential bugs** in your code.',
    refs: [{type: 'group', plugin: 'eslint', slug: 'problems', weight: 1}],
  },
  {
    slug: 'code-style',
    title: 'Code style',
    description:
      'Lint rules that promote **good practices** and consistency in your code.',
    refs: [{type: 'group', plugin: 'eslint', slug: 'suggestions', weight: 1}],
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

export const jsPackagesCoreConfig = async (): Promise<Partial<CoreConfig>> => {
  return {
    plugins: [await jsPackagesPlugin()],
    categories: jsPackagesCategories,
  };
};

export const lighthouseCoreConfig = async (
  url: string,
): Promise<Partial<CoreConfig>> => {
  return {
    plugins: [
      await lighthousePlugin(url, {
        chromeFlags: DEFAULT_FLAGS.concat(['--headless']),
      }),
    ],
    categories: lighthouseCategories,
  };
};

export const eslintCoreConfigNx = async (
  projectName?: string,
): Promise<Partial<CoreConfig>> => {
  return {
    plugins: [
      await eslintPlugin(
        await (projectName
          ? eslintConfigFromNxProject(projectName)
          : eslintConfigFromAllNxProjects()),
      ),
    ],
    categories: eslintCategories,
  };
};

export const coverageCoreConfigNx = async (
  projectName?: string,
): Promise<Partial<Partial<CoreConfig>>> => {
  if (projectName) {
    throw new Error('coverageCoreConfigNx for single projects not implemented');
  }
  const targetNames = ['unit-test'];
  const targetArgs = [
    '-t',
    'unit-test',
    '--include=tags:type:example,type:app',
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
            projectName ? `run --project ${projectName} --exclude=tags:type:e2e-vi,type:testing` : 'run-many --exclude=tags:type:e2e-vi,type:testing',
            ...targetArgs,
          ],
        },
        reports: await getNxCoveragePaths(targetNames),
      }),
    ],
    categories: coverageCategories,
  };
};
