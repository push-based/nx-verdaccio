import {
  type CreateNodes,
  readJsonFile,
  TargetConfiguration,
} from '@nx/devkit';
import { dirname, join, relative } from 'node:path';
import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string, opts: undefined | unknown) => {
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      join(process.cwd(), projectConfigurationFile)
    );

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
            ...(isNpmEnv && verdaccioTargets()),
            ...(isPublishable && npmTargets({ ...projectConfiguration, root })),
          },
        },
      },
    };
  },
];

function verdaccioTargets() {
  return {
    'start-verdaccio': {
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
      },
    },
  };
}

function npmTargets(
  projectConfiguration: ProjectConfiguration
): Record<string, TargetConfiguration> {
  const { root, name, targets } = projectConfiguration;
  const { build } = targets;
  const { options } = build;
  const { outputPath } = options;
  if (outputPath == null) {
    throw new Error('outputPath is required');
  }
  const relativeFromOutputPath = relative(
    join(process.cwd(), outputPath),
    join(process.cwd())
  );
  const { name: packageName, version: pkgVersion } = readJsonFile(
    join(root, 'package.json')
  );
  return {
    'npm-publish': {
      command: `npm publish --userconfig=${relativeFromOutputPath}/{args.userconfig}`,
      options: {
        cwd: outputPath,
      },
    },
    'npm-install': {
      command: `npm install --no-fund --no-shrinkwrap --no-save ${packageName}@{args.pkgVersion} --perfix={args.prefix} --userconfig={args.prefix}/.npmrc`,
      options: {
        pkgVersion,
        prefix: '.',
      },
    },
    'npm-uninstall': {
      command: `npm uninstall ${packageName}`,
    },
  };
}
