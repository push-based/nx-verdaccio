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
  (projectConfigurationFile: string, _: undefined | unknown) => {
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      join(process.cwd(), projectConfigurationFile)
    );

    const projectName = projectConfiguration.name;
    if (projectName == null) {
      throw new Error('Project name required');
    }

    // only execute for the -env example projects e.g. `cli-e2e-env`, `e2e-models-env`
    if (!projectName.endsWith('-env')) {
      return {
        projects: {
          [root]: {},
        },
      };
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
    'env-start-verdaccio': {
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
        storage: join('tmp', 'local-registry', 'storage'),
      },
    },
    'env-setup-npm-env': {
      command:
        'tsx --tsconfig=tools/tsconfig.tools.json tools/tools-utils/src/bin/setup-npm-env.ts',
      options: {
        projectName,
        targetName: 'env-start-verdaccio',
        workspaceRoot: join(tmpNpmEnv, projectName),
        location: 'none',
      },
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
    'env-npm-publish': {
      command: `npm publish --userconfig=${relativeFromPath(
        outputPath
      )}/${tmpNpmEnv}/{args.envProjectName}/.npmrc`,
      options: {
        cwd: outputPath,
        envProjectName: `${projectName}-npm-env`,
      },
    },
    'env-npm-install': {
      command: `npm install --no-fund --no-shrinkwrap --save ${packageName}@{args.pkgVersion} --prefix=${tmpNpmEnv}/{args.envProjectName} --userconfig=${relativeFromPath(
        outputPath
      )}/${tmpNpmEnv}/{args.envProjectName}/.npmrc`,
      options: {
        pkgVersion,
        envProjectName: `${projectName}-npm-env`,
      },
    },
    'env-npm-uninstall': {
      command: `npm uninstall ${packageName}`,
    },
  };
}
