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
      (target) => target === 'publishable'
    );
    if (!isPublishable) {
      return {};
    }

    return {
      projects: {
        [root]: {
          targets: npmTargets({ ...projectConfiguration, root }),
        },
      },
    };
  },
];

function npmTargets(projectConfiguration: ProjectConfiguration) {
  const { root, name } = projectConfiguration;
  const { name: packageName, version: pkgVersion } = readJsonFile(
    join(root, 'package.json')
  );
  return {
    'npm-install': {
      command: `npm install -D ${packageName}@{args.pkgVersion}`,
      options: {
        pkgVersion,
      },
    },
    'npm-uninstall': {
      command: `npm uninstall ${packageName}`,
    },
  };
}
