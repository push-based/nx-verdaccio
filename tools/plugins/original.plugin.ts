import { type CreateNodes, readJsonFile } from '@nx/devkit';
import { dirname, join } from 'node:path';
import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string, opts: undefined | unknown) => {
    const root = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      join(process.cwd(), projectConfigurationFile)
    );

    const isPublishable = (projectConfiguration?.tags ?? []).some(
      (tag) => tag === 'publishable'
    );
    const isRoot = root === '.';

    return {
      projects: {
        [root]: {
          targets: {
            ...(isRoot && verdaccioTargets({ ...projectConfiguration, root })),
            ...(isPublishable && npmTargets({ ...projectConfiguration, root })),
          },
        },
      },
    };
  },
];

function verdaccioTargets(projectConfiguration: ProjectConfiguration) {
  const { root, name } = projectConfiguration;
  const { name: packageName, version: pkgVersion } = readJsonFile(
    join(root, 'package.json')
  );

  return {
    'original-local-registry': {
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
        storage: `tmp/local-registry/storage`,
      },
    },
  };
}

function npmTargets(projectConfiguration: ProjectConfiguration) {
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
  return {
    'original-npm-publish': {
      command: 'npm publish',
      options: {
        cwd: outputPath,
      },
    },
    'original-npm-install': {
      command: `npm install -D ${packageName}@{args.pkgVersion}`,
      options: {
        pkgVersion,
      },
    },
    'original-npm-uninstall': {
      command: `npm uninstall ${packageName}`,
    },
  };
}
