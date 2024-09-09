import {
  type CreateNodes,
  readJsonFile,
  TargetConfiguration,
} from '@nx/devkit';
import { dirname, join, relative } from 'node:path';
import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { getBuildOutputPathFromBuildTarget } from '@org/tools-utils';

const tmpNpmEnv = join('tmp', 'npm-env');

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
      console.info('verdaccioTargets' + projectConfiguration.name);
    }
    isPublishable && console.info('npmTargets' + projectConfiguration.name);
    return {
      projects: {
        [root]: {
          targets: {
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

function verdaccioTargets(
  projectConfiguration: ProjectConfiguration & { name: string }
): Record<string, TargetConfiguration> {
  const { name: projectName } = projectConfiguration;
  return {
    'graph-start-verdaccio': {
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
        storage: join(tmpNpmEnv, projectName, 'storage'),
        clear: true,
      },
    },
    'graph-setup-npm-env': {
      command:
        'tsx --tsconfig=tools/tsconfig.tools.json tools/tools-utils/src/bin/setup-npm-env.ts',
      options: {
        projectName,
        envProjectName: projectName,
        targetName: 'graph-start-verdaccio',
        workspaceRoot: join(tmpNpmEnv, projectName),
        location: 'none',
        readyWhen: 'Environment ready under',
      },
    },
    'graph-install-npm-env': {
      dependsOn: [
        {
          projects: 'dependencies',
          target: 'graph-npm-install',
          params: 'forward',
        },
      ],
      command: 'echo Dependencies installed!',
      options: {},
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
    'graph-npm-publish': {
      dependsOn: [
        { projects: 'self', target: 'build', params: 'forward' },
        {
          projects: 'dependencies',
          target: 'graph-npm-publish',
          params: 'forward',
        },
      ],
      command: `npm publish --userconfig=${relativeFromPath(
        outputPath
      )}/${tmpNpmEnv}/{args.envProjectName}/.npmrc`,
      options: {
        cwd: outputPath,
        envProjectName: `${projectName}-npm-env`,
      },
    },
    'graph-npm-install': {
      dependsOn: [
        { projects: 'self', target: 'graph-npm-publish', params: 'forward' },
        {
          projects: 'dependencies',
          target: 'graph-npm-install',
          params: 'forward',
        },
      ],
      command: `npm install --no-fund --no-shrinkwrap --save ${packageName}@{args.pkgVersion} --prefix=${tmpNpmEnv}/{args.envProjectName} --userconfig=${relativeFromPath(
        outputPath
      )}/${tmpNpmEnv}/{args.envProjectName}/.npmrc`,
      options: {
        pkgVersion,
        envProjectName: projectName,
      },
    },
    'graph-npm-uninstall': {
      command: `npm uninstall ${packageName}`,
    },
  };
}
