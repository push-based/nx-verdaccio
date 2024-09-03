import {
  type CreateNodes,
  readJsonFile,
  type TargetConfiguration,
  type ProjectConfiguration,
  logger,
} from '@nx/devkit';
import { dirname, join, relative } from 'node:path';
import { DEFAULT_ENVIRONMENT_OUTPUT_DIR } from '../internal/constants';
import {
  Environment,
  StartVerdaccioAndSetupEnvOptions,
} from '../internal/verdaccio/verdaccio-npm-env';
import { StarVerdaccioOptions } from '../internal/verdaccio/verdaccio-registry';

export type BuildEnvPluginCreateNodeOptions = {
  environmentsDir?: string;
};
export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string, opt: unknown) => {
    const { environmentsDir = DEFAULT_ENVIRONMENT_OUTPUT_DIR } =
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
            ...(isNpmEnv && verdaccioTargets({ workspaceRoot })),
            // setup-npm-env, setup-env, setup-deps
            ...(isNpmEnv && envTargets({ workspaceRoot, projectName })),
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
  workspaceRoot,
  ...options
}: Environment & StarVerdaccioOptions): Record<string, TargetConfiguration> {
  return {
    'start-verdaccio': {
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
        storage: join(workspaceRoot, 'storage'),
        clear: true,
        ...options,
      },
    },
    'stop-verdaccio': {
      executor: '@org/build-env:kill-process',
      options: {
        filePath: join(workspaceRoot, 'verdaccio-registry.json'),
        ...options,
      },
    },
  };
}

function envTargets({
  workspaceRoot,
  projectName,
}: Environment & {
  projectName: string;
}): Record<string, TargetConfiguration> {
  return {
    'setup-npm-env': {
      command:
        'tsx --tsconfig=tools/tsconfig.tools.json tools/tools-utils/src/bin/setup-npm-env.ts',
      options: {
        projectName,
        targetName: 'start-verdaccio',
        envProjectName: projectName,
        readyWhen: 'Environment ready under',
      },
    },
    'setup-env': {
      inputs: ['default', '^production'],
      executor: 'nx:run-commands',
      options: {
        commands: [
          `nx setup-npm-env ${projectName} --workspaceRoot={args.envProjectName}`,
          `nx install-deps ${projectName} --envProjectName={args.envProjectName}`,
          `nx stop-verdaccio ${projectName}`,
        ],
        workspaceRoot,
        forwardAllArgs: true,
        // @TODO rename to more intuitive name
        envProjectName: projectName,
        parallel: false,
      },
    },
    'install-deps': {
      dependsOn: [
        {
          projects: 'dependencies',
          target: 'npm-install',
          params: 'forward',
        },
      ],
      options: {
        envProjectName: projectName,
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
  const prefix = `${environmentProject}/{args.environmentProject}`;

  return {
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
      // dist/projects/models
      inputs: [{ dependentTasksOutputFiles: `**/{options.outputPath}/**` }],
      /*outputs: [
        //
        `{workspaceRoot}/${environmentsDir}/{args.environmentProject}/storage/@org/${packageName}`,
      ],*/
      cache: true,
      command: `npm publish --userconfig=${userconfig}`,
      options: {
        cwd: outputPath,
      },
    },
    'npm-install': {
      dependsOn: [
        { projects: 'self', target: 'npm-publish', params: 'forward' },
        {
          projects: 'dependencies',
          target: 'npm-install',
          params: 'forward',
        },
      ],
      command: `npm install --no-fund --no-shrinkwrap --save ${packageName}@{args.pkgVersion} --prefix=${prefix} --userconfig=${userconfig}`,
      options: {
        pkgVersion,
        environmentProject: environmentProject,
      },
    },
  };
}
