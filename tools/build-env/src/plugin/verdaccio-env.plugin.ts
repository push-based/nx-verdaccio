import {
  type CreateNodes,
  readJsonFile,
  type TargetConfiguration,
  type ProjectConfiguration,
} from '@nx/devkit';
import { dirname, join, relative } from 'node:path';

const tmpNpmEnv = join('tmp', 'npm-env');

export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string) => {
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
    const name = projectConfiguration?.name ?? '';
    const tags = projectConfiguration?.tags ?? [];
    const isPublishable = tags.some((target) => target === 'publishable');
    const isNpmEnv = tags.some((target) => target === 'npm-env');

    return {
      projects: {
        [root]: {},
      },
    };

    return {
      projects: {
        [root]: {
          targets: {
            // === e2e project
            // start-verdaccio, stop-verdaccio
            ...(isNpmEnv &&
              verdaccioTargets({ ...projectConfiguration, name })),
            // setup-npm-env, setup-env, setup-deps
            ...(isNpmEnv && envTargets(projectConfiguration)),
            // === dependency project
            // npm-publish, npm-install
            ...(isPublishable &&
              npmTargets({ ...projectConfiguration, root }, envProjectName)),
          },
        },
      },
    };
  },
];

function verdaccioTargets(
  projectConfiguration: Omit<ProjectConfiguration, 'name'> & { name: string }
): Record<string, TargetConfiguration> {
  const { name: projectName } = projectConfiguration;
  return {
    'start-verdaccio': {
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
        storage: join(tmpNpmEnv, projectName, 'storage'),
        clear: true,
      },
    },
    'stop-verdaccio': {
      executor: '@org/build-env:kill-process',
      options: {
        filePath: join(tmpNpmEnv, projectName),
      },
    },
  };
}

function envTargets(
  projectConfiguration: ProjectConfiguration
): Record<string, TargetConfiguration> {
  const { name: projectName } = projectConfiguration;
  return {
    'setup-npm-env': {
      command:
        'tsx --tsconfig=tools/tsconfig.tools.json tools/tools-utils/src/bin/setup-npm-env.ts',
      options: {
        projectName,
        targetName: 'start-verdaccio',
        envProjectName: join(tmpNpmEnv, projectName),
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
          `nx stop-verdaccio ${projectName} --workspaceRoot={args.workspaceRoot}`,
        ],
        workspaceRoot: join(tmpNpmEnv, projectName),
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
  projectConfiguration: ProjectConfiguration,
  envProjectName: string
): Record<string, TargetConfiguration> {
  const { root, targets } = projectConfiguration;
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
  )}/${tmpNpmEnv}/{args.envProjectName}/.npmrc`;
  const prefix = `${tmpNpmEnv}/{args.envProjectName}`;

  return {
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
      outputs: [
        //
        `{workspaceRoot}/${tmpNpmEnv}/{args.envProjectName}/storage/@org/${packageName}`,
      ],
      cache: true,
      command: `npm publish --userconfig=${userconfig}`,
      options: {
        cwd: outputPath,
        envProjectName,
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
        envProjectName,
      },
    },
  };
}
