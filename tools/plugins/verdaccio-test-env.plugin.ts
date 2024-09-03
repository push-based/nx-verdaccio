import {
  type CreateNodes,
  readJsonFile,
  TargetConfiguration,
} from '@nx/devkit';
import { dirname, join, relative } from 'node:path';
import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

const tmpNpmEnv = join('tmp', 'npm-env');

export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string) => {
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      join(process.cwd(), projectConfigurationFile)
    );

    const tags = projectConfiguration?.tags ?? [];
    const isPublishable = tags.some((target) => target === 'publishable');
    const isNpmEnv = tags.some((target) => target === 'npm-env');

    return {
      projects: {
        [root]: {
          targets: {
            // === e2e project
            // start-verdaccio, stop-verdaccio
            ...(isNpmEnv && verdaccioTargets(projectConfiguration)),
            // setup-npm-env, setup-env, setup-deps
            ...(isNpmEnv && envTargets(projectConfiguration)),
            // === dependency project
            // npm-publish, npm-install
            ...(isPublishable && npmTargets({ ...projectConfiguration, root })),
          },
        },
      },
    };
  },
];

function verdaccioTargets(
  projectConfiguration: ProjectConfiguration
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
      command:
        'tsx --tsconfig=tools/tsconfig.tools.json tools/bin/teardown-npm-env.ts --workspaceRoot={args.workspaceRoot}',
      options: {
        workspaceRoot: join(tmpNpmEnv, projectName),
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
        'tsx --tsconfig=tools/tsconfig.tools.json tools/bin/setup-npm-env.ts',
      options: {
        projectName,
        targetName: 'start-verdaccio',
        workspaceRoot: join(tmpNpmEnv, projectName),
        readyWhen: 'Environment ready under',
      },
    },
    'setup-env': {
      inputs: ['default', '^production', '!{projectRoot}/**/*.md'],
      outputs: [
        `{workspaceRoot}/${tmpNpmEnv}/${projectName}/node_modules`,
        `{workspaceRoot}/${tmpNpmEnv}/${projectName}/.npmrc`,
        `{workspaceRoot}/${tmpNpmEnv}/${projectName}/package.json`,
      ],
      executor: 'nx:run-commands',
      options: {
        commands: [
          `nx setup-npm-env ${projectName}`,
          `nx setup-deps ${projectName} --envProjectName={args.envProjectName}`,
          `nx stop-verdaccio ${projectName} --workspaceRoot={args.workspaceRoot}`,
        ],
        workspaceRoot: join(tmpNpmEnv, projectName),
        forwardAllArgs: true,
        envProjectName: projectName,
        parallel: false,
      },
    },
    'setup-deps': {
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

const relativeFromPath = (dir) =>
  relative(join(process.cwd(), dir), join(process.cwd()));

function npmTargets(
  projectConfiguration: ProjectConfiguration
): Record<string, TargetConfiguration> {
  const { root, name: projectName, targets } = projectConfiguration;
  const { build } = targets;
  const { options } = build;
  const { outputPath } = options;
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
  const envProjectName = projectName;

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
