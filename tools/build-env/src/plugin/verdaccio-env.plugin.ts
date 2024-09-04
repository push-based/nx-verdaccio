import {
  type CreateNodes,
  type ProjectConfiguration,
  readJsonFile,
  type TargetConfiguration,
} from '@nx/devkit';
import { dirname, join } from 'node:path';
import { DEFAULT_ENVIRONMENTS_OUTPUT_DIR } from '../internal/constants';
import type { StarVerdaccioOptions } from '../internal/verdaccio/verdaccio-registry';

export function isPublishable(tags: string[]): boolean {
  return tags.some((target) => target === 'publishable');
}

export function isNpmEnv(tags: string[]): boolean {
  return tags.some((tag) => tag === 'npm-env');
}

export type BuildEnvPluginCreateNodeOptions = {
  environmentsDir?: string;
};
export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string, opt: unknown) => {
    const { environmentsDir = DEFAULT_ENVIRONMENTS_OUTPUT_DIR } =
      (opt as BuildEnvPluginCreateNodeOptions) ?? {};

    const projectConfiguration: ProjectConfiguration = readJsonFile(
      join(process.cwd(), projectConfigurationFile)
    );

    if (
      !('name' in projectConfiguration) ||
      typeof projectConfiguration.name !== 'string'
    ) {
      throw new Error('Project name is required');
    }
    const projectName = projectConfiguration.name;
    const tags = projectConfiguration?.tags ?? [];

    const projectRoot = dirname(projectConfigurationFile);
    const environmentRoot = join(environmentsDir, projectName);
    return {
      projects: {
        [projectRoot]: {
          targets: {
            // start-verdaccio, stop-verdaccio
            ...(isNpmEnv(tags) && verdaccioTargets({ environmentRoot })),
            // bootstrap-env, setup-env, install-deps (intermediate task to run dependency tasks)
            ...(isNpmEnv(tags) && envTargets({ environmentRoot, projectName })),
            // === dependency project
            // npm-publish, npm-install
            ...(isPublishable(tags) && npmTargets(projectName)),
          },
        },
      },
    };
  },
];

function verdaccioTargets({
  environmentRoot,
  ...options
}: StarVerdaccioOptions & {
  environmentRoot: string;
}): Record<string, TargetConfiguration> {
  return {
    // @TODO: consider using the executor function directly to reduce the number of targets
    'start-verdaccio': {
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
        storage: join(environmentRoot, 'storage'),
        clear: true,
        ...options,
      },
    },
    'stop-verdaccio': {
      executor: '@org/build-env:kill-process',
      options: {
        filePath: join(environmentRoot, 'verdaccio-registry.json'),
        ...options,
      },
    },
  };
}

function envTargets({
  environmentRoot,
  projectName,
}: { environmentRoot: string } & {
  projectName: string;
}): Record<string, TargetConfiguration> {
  return {
    'bootstrap-env': {
      executor: '@org/build-env:bootstrap',
    },
    // just here to execute dependent npm-install tasks with the correct environmentProject
    'install-env': {
      dependsOn: [
        {
          projects: 'dependencies',
          target: 'npm-install',
          params: 'forward',
        },
      ],
      options: { environmentProject: projectName },
      command: 'echo Dependencies installed!',
    },
    // runs bootstrap-env, install-env and stop-verdaccio
    'setup-env': {
      executor: '@org/build-env:setup',
      options: { environmentRoot },
    },
  };
}

function npmTargets(
  environmentProject: string
): Record<string, TargetConfiguration> {
  return {
    'npm-publish': {
      dependsOn: [
        { projects: 'self', target: 'build', params: 'forward' },
        { projects: 'dependencies', target: 'npm-publish', params: 'forward' },
      ],
      executor: '@org/build-env:npm-publish',
      options: { environmentProject },
    },
    'npm-install': {
      dependsOn: [
        { projects: 'self', target: 'npm-publish', params: 'forward' },
        { projects: 'dependencies', target: 'npm-install', params: 'forward' },
      ],
      executor: '@org/build-env:npm-install',
      options: { environmentProject },
    },
  };
}
