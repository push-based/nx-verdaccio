import {
  createNodesFromFiles,
  type CreateNodesV2,
  readJsonFile,
  TargetConfiguration,
} from '@nx/devkit';
import { dirname, join } from 'node:path';
import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { getBuildOutputPathFromBuildTarget } from './utils/build-target-helper';

export const createNodesV2: CreateNodesV2 = [
  '**/project.json',
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (projectConfigurationFile: string) => {
        const root = dirname(projectConfigurationFile);
        const projectConfiguration: ProjectConfiguration = readJsonFile(
          join(process.cwd(), projectConfigurationFile)
        );

        const projectName = projectConfiguration.name;
        if (projectName == null) {
          throw new Error('Project name required');
        }
        const isRoot = root === '.';
        const isPublishable = (projectConfiguration?.tags ?? []).some(
          (tag) => tag === 'publishable'
        );

        return {
          projects: {
            [root]: {
              targets: {
                ...(isRoot && verdaccioTargets()),
                ...(isPublishable &&
                  npmTargets({
                    ...projectConfiguration,
                    root,
                    name: projectName,
                  })),
              },
            },
          },
        };
      },
      configFiles,
      options,
      context
    );
  },
];

/**
 * @deprecated Use `createNodesV2` instead. This will be removed in Nx 22.
 */
export const createNodes = createNodesV2;

function verdaccioTargets(): Record<string, TargetConfiguration> {
  return {
    'original-local-registry': {
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
        storage: `tmp/local-registry/storage`,
        port: 4210,
      },
    },
  };
}

function npmTargets(
  projectConfiguration: ProjectConfiguration & { name: string }
): Record<string, TargetConfiguration> {
  const { root, name, tags } = projectConfiguration;
  const outputPath = getBuildOutputPathFromBuildTarget(projectConfiguration);

  const { name: packageName, version: pkgVersion } = readJsonFile(
    join(root, 'package.json')
  );
  //
  if (!tags?.some((i) => i === 'type:example')) {
    return {};
  }
  return {
    'original-npm-publish': {
      command: 'npm publish',
      options: {
        cwd: outputPath,
      },
    },
    'original-npm-install': {
      command: `npm install -D --no-fund --no-package-lock ${packageName}@{args.pkgVersion}`,
      options: {
        pkgVersion,
      },
    },
    'original-npm-uninstall': {
      command: `npm uninstall ${packageName}@{args.pkgVersion}`,
      options: {
        pkgVersion,
      },
    },
  };
}
