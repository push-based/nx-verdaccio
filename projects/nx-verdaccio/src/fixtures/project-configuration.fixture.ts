import type { ProjectConfiguration } from '@nx/devkit';

const MOCK_PROJECT_CONFIGURATION: ProjectConfiguration = {
  name: 'mock-project',
  root: 'apps/mock-project',
  sourceRoot: 'apps/mock-project/src',
  projectType: 'application',
  tags: ['e2e', 'unit-test'],
  implicitDependencies: ['shared-library'],
  targets: {
    build: {
      executor: '@nx/web:build',
      options: {
        outputPath: 'dist/apps/mock-project',
        index: 'apps/mock-project/src/index.html',
        main: 'apps/mock-project/src/main.ts',
        tsConfig: 'apps/mock-project/tsconfig.app.json',
      },
      configurations: {
        production: {
          fileReplacements: [
            {
              replace: 'apps/mock-project/src/environments/environment.ts',
              with: 'apps/mock-project/src/environments/environment.prod.ts',
            },
          ],
          optimization: true,
          sourceMap: false,
        },
      },
    },
  },
  generators: {
    '@nx/react': {
      library: {
        style: 'scss',
      },
    },
  },
  namedInputs: {
    default: ['{projectRoot}/**/*', '!{projectRoot}/**/*.spec.ts'],
    production: ['default', '!{projectRoot}/**/*.test.ts'],
  },
  release: {
    version: {
      generator: '@nx/version',
      generatorOptions: {
        increment: 'minor',
      },
    },
  },
  metadata: {
    description: 'This is a mock project for testing.',
  },
};

export const MOCK_TARGETS_CACHE: Record<
  string,
  Partial<ProjectConfiguration>
> = {
  mockKey: MOCK_PROJECT_CONFIGURATION,
};
