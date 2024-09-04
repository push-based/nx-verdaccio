import {
  type CreateNodes,
  readJsonFile,
  type TargetConfiguration,
  type ProjectConfiguration,
  logger,
} from '@nx/devkit';
import { dirname, join, relative } from 'node:path';
import { DEFAULT_ENVIRONMENTS_OUTPUT_DIR } from '../internal/constants';
import {
  Environment,
  BootstrapEnvironmentOptions,
} from '../internal/verdaccio/verdaccio-npm-env';
import { StarVerdaccioOptions } from '../internal/verdaccio/verdaccio-registry';

export type BuildEnvPluginCreateNodeOptions = {
  environmentsDir?: string;
};
export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string, opt: unknown) => {
    const { environmentsDir = DEFAULT_ENVIRONMENTS_OUTPUT_DIR } =
      (opt as BuildEnvPluginCreateNodeOptions) ?? {};

    console.log('projectConfigurationFile', projectConfigurationFile);
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      join(process.cwd(), projectConfigurationFile)
    );

    if (
      !('name' in projectConfiguration) ||
      typeof projectConfiguration.name !== 'string'
    ) {
      throw new Error('Project name is required');
    }
    const { name: envProjectName } =
      readJsonFile<ProjectConfiguration>('project.json');
    const projectName = projectConfiguration.name;
    const tags = projectConfiguration?.tags ?? [];
    const isPublishable = tags.some((target) => target === 'publishable');
    const isNpmEnv = tags.some((target) => target === 'npm-env');
    const workspaceRoot = join(environmentsDir, projectName);

    return {
      projects: {
        [root]: {
          targets: {
            // === e2e project
            // start-verdaccio, stop-verdaccio
            ...(isNpmEnv && verdaccioTargets({ root: workspaceRoot })),
            // setup-npm-env, setup-env, setup-deps
            ...(isNpmEnv && envTargets({ root: workspaceRoot, projectName })),
            // === dependency project
            // npm-publish, npm-install
            ...(isPublishable &&
              npmTargets(
                { ...projectConfiguration, root, environmentsDir },
                envProjectName
              )),
          },
        },
      },
    };
  },
];

function verdaccioTargets({
  root,
  ...options
}: Environment & StarVerdaccioOptions): Record<string, TargetConfiguration> {
  return {
    'start-verdaccio': {
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
        storage: join(root, 'storage'),
        clear: true,
        ...options,
      },
    },
    'stop-verdaccio': {
      executor: '@org/build-env:kill-process',
      options: {
        filePath: join(root, 'verdaccio-registry.json'),
        ...options,
      },
    },
  };
}

function envTargets({
  root: environmentRoot,
  projectName,
}: Environment & {
  projectName: string;
}): Record<string, TargetConfiguration> {
  return {
    'build-env': {
      executor: '@org/build-env:build',
      options: {
        environmentRoot,
      },
    },
    'setup-env': {
      inputs: ['default', '^production'],
      executor: '@org/build-env:setup-env',
    },
    // just here to execute dependent npm-install tasks with the correct environmentProject
    'install-deps': {
      dependsOn: [
        {
          projects: 'dependencies',
          target: 'npm-install',
          params: 'forward',
        },
      ],
      options: {
        environmentRoot,
        environmentProject: projectName,
      },
      command: 'echo Dependencies installed!',
    },
  };
}

const relativeFromPath = (dir: string) =>
  relative(join(process.cwd(), dir), join(process.cwd()));

function npmTargets(
  projectConfiguration: ProjectConfiguration & {
    root: string;
    environmentsDir: string;
  },
  environmentProject: string
): Record<string, TargetConfiguration> {
  const { root, targets, environmentsDir } = projectConfiguration;
  const { build } =
    (targets as Record<'build', TargetConfiguration<{ outputPath: string }>>) ??
    {};
  const { options } = build ?? {};
  const { outputPath } = options ?? {};
  if (outputPath == null) {
    throw new Error('outputPath is required');
  }

  const { name: packageName, version: pkgVersion } = readJsonFile(
    join(root, 'package.json')
  );
  const userconfig = `${relativeFromPath(
    outputPath
  )}/${environmentsDir}/{args.environmentProject}/.npmrc`;
  const prefix = `${environmentsDir}/{args.environmentProject}`;

  return {
    // @TODO: try leverage nx-release-publish
    // nx npm-publish models --environmentProject=cli-e2e
    'npm-publish': {
      dependsOn: [
        { projects: 'self', target: 'build', params: 'forward' },
        {
          projects: 'dependencies',
          target: 'npm-publish',
          params: 'forward',
        },
      ],
      inputs: [{ dependentTasksOutputFiles: `**/{options.outputPath}/**` }],
      /*outputs: [
        //
        `{workspaceRoot}/${environmentsDir}/{args.environmentProject}/storage/@org/${packageName}`,
      ],*/
      // cache: true,
      command: `npm publish --userconfig=${userconfig}`,
      options: {
        cwd: outputPath,
      },
    },
    'npm-install': {
      dependsOn: [
        { projects: 'self', target: 'npm-publish', params: 'forward' },
        { projects: 'dependencies', target: 'npm-install', params: 'forward' },
      ],
      executor: '@org/build-env:npm-install',
      options: {
        environmentProject,
      },
    },
    'npm-install-old': {
      dependsOn: [
        { projects: 'self', target: 'npm-publish', params: 'forward' },
        { projects: 'dependencies', target: 'npm-install', params: 'forward' },
      ],
      command: `npm install --no-fund --no-shrinkwrap --save ${packageName}@{args.pkgVersion} --prefix=${prefix} --userconfig=${userconfig}`,
      options: {
        pkgVersion,
        environmentProject: environmentProject,
      },
    },
  };
}
