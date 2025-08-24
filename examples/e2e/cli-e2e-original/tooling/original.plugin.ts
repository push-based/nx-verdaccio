import {
  type CreateNodes,
  createNodesFromFiles,
  type CreateNodesV2,
  ExecutorContext,
  readJsonFile,
  TargetConfiguration,
} from '@nx/devkit';
import { dirname, join } from 'node:path';
import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';
import { getTargetOutputPath } from './utils/build-target-helper';

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
              npmTargets({ ...projectConfiguration, root, name: projectName })),
          },
        },
      },
    };
  },
];

export const createNodesV2: CreateNodesV2<undefined> = [
  '**/project.json',
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      async (projectConfigurationFile) => {
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
  const outputPath = getTargetOutputPath(
    {
      project: name,
      target: 'build',
    },
    {
      root,
      cwd: process.cwd(),
      isVerbose: false,
      nxJsonConfiguration: {},
      projectsConfigurations: {
        version: 2,
        projects: {
          [name]: projectConfiguration,
        },
      },
    } as ExecutorContext
  );

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
