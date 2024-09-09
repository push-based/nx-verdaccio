import {
  type CreateNodes,
  readJsonFile,
  TargetConfiguration,
} from '@nx/devkit';
import { dirname, join, relative } from 'node:path';
import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { getBuildOutputPathFromBuildTarget } from '@org/tools-utils';

const tmpEnv = join('tmp', 'environment');

export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string) => {
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      join(process.cwd(), projectConfigurationFile)
    );

    const projectName = projectConfiguration.name;
    if (projectName == null) {
      throw new Error('Project name required');
    }

    const tags = projectConfiguration?.tags ?? [];
    const isPublishable = tags.some((target) => target === 'publishable');
    const isNpmEnv = tags.some((target) => target === 'npm-env');
    if (isNpmEnv) {
      console.info('verdaccioTargets' + projectName);
    }
    isPublishable && console.info('npmTargets' + projectName);
    return {
      projects: {
        [root]: {
          targets: {
            ...(isNpmEnv && e2eTargets(projectConfiguration)),
            ...(isNpmEnv &&
              verdaccioTargets({ ...projectConfiguration, name: projectName })),
            ...(isPublishable &&
              npmTargets({ ...projectConfiguration, root, name: projectName })),
          },
        },
      },
    };
  },
];

function e2eTargets(
  projectConfiguration: ProjectConfiguration
): Record<string, TargetConfiguration> {
  const { name: projectName } = projectConfiguration;
  return {
    e2e: {
      dependsOn: [
        {
          projects: 'self',
          target: 'pretarget-setup-env',
          params: 'forward',
        },
      ],
      options: {
        envProjectName: projectName,
      },
    },
  };
}

function verdaccioTargets(
  projectConfiguration: ProjectConfiguration & { name: string }
): Record<string, TargetConfiguration> {
  const { name: projectName } = projectConfiguration;
  return {
    'pretarget-start-verdaccio': {
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
        storage: join(tmpEnv, projectName, 'storage'),
        clear: true,
      },
    },
    'pretarget-setup-npm-env': {
      command:
        'tsx --tsconfig=e2e-examples/cli-e2e-pretarget/tsconfig.tools.json e2e-examples/cli-e2e-pretarget/tooling/bin/setup-npm-env.ts',
      options: {
        projectName,
        targetName: 'pretarget-start-verdaccio',
        workspaceRoot: join(tmpEnv, projectName),
        readyWhen: 'Environment ready under',
      },
    },
    'pretarget-teardown-env': {
      command:
        'tsx --tsconfig=e2e-examples/cli-e2e-pretarget/tsconfig.tools.json e2e-examples/cli-e2e-pretarget/tooling/bin/stop-verdaccio.ts --workspaceRoot={args.workspaceRoot}',
      options: {
        workspaceRoot: join(tmpEnv, projectName),
      },
    },
    'pretarget-setup-env': {
      cache: true,
      inputs: ['default', '^production', '!{projectRoot}/**/*.md'],
      outputs: [`{workspaceRoot}/${tmpEnv}/${projectName}/node_modules`],
      executor: 'nx:run-commands',
      options: {
        commands: [
          `nx pretarget-setup-npm-env ${projectName}`,
          `nx pretarget-setup-deps ${projectName} --envProjectName={args.envProjectName}`,
          `nx pretarget-teardown-env ${projectName} --workspaceRoot={args.workspaceRoot}`,
        ],
        workspaceRoot: join(tmpEnv, projectName),
        forwardAllArgs: true,
        envProjectName: projectName,
        parallel: false,
      },
    },
    'pretarget-setup-deps': {
      dependsOn: [
        {
          projects: 'dependencies',
          target: 'pretarget-npm-install',
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
  projectConfiguration: ProjectConfiguration & { name: string }
): Record<string, TargetConfiguration> {
  const { root, name: projectName } = projectConfiguration;
  const outputPath = getBuildOutputPathFromBuildTarget(projectConfiguration);

  const { name: packageName, version: pkgVersion } = readJsonFile(
    join(root, 'package.json')
  );

  return {
    'pretarget-npm-publish': {
      dependsOn: [
        { projects: 'self', target: 'build', params: 'forward' },
        {
          projects: 'dependencies',
          target: 'pretarget-npm-publish',
          params: 'forward',
        },
      ],
      command: `npm publish --userconfig=${relativeFromPath(
        outputPath
      )}/${tmpEnv}/{args.envProjectName}/.npmrc`,
      options: {
        cwd: outputPath,
        envProjectName: `${projectName}`,
      },
    },
    'pretarget-npm-install': {
      dependsOn: [
        {
          projects: 'self',
          target: 'pretarget-npm-publish',
          params: 'forward',
        },
        {
          projects: 'dependencies',
          target: 'pretarget-npm-install',
          params: 'forward',
        },
      ],
      command: `npm install --no-fund --no-shrinkwrap --save ${packageName}@{args.pkgVersion} --prefix=${tmpEnv}/{args.envProjectName} --userconfig=${relativeFromPath(
        outputPath
      )}/${tmpEnv}/{args.envProjectName}/.npmrc`,
      options: {
        pkgVersion,
        envProjectName: projectName,
      },
    },
  };
}
