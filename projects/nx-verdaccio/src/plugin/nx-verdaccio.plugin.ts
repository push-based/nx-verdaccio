import {
  type CreateNodes,
  type CreateNodesContextV2,
  createNodesFromFiles,
  type CreateNodesV2,
  logger,
  type ProjectConfiguration,
  readJsonFile,
} from '@nx/devkit';
import { dirname, join } from 'node:path';
import { normalizeCreateNodesOptions } from './normalize-create-nodes-options';
import type { NxVerdaccioCreateNodeOptions } from './schema';
import { createProjectConfiguration } from './targets/create-targets';
import { loadMergedProjectConfig } from './project-config';
import { combineGlobPatterns } from 'nx/src/utils/globs';

const PROJECT_JSON_FILE_GLOB = '**/project.json';
const PACKAGE_JSON_FILE_GLOB = '**/package.json';
const FILE_GLOB = combineGlobPatterns(
  PROJECT_JSON_FILE_GLOB,
  PACKAGE_JSON_FILE_GLOB
);

export const createNodesV2: CreateNodesV2<NxVerdaccioCreateNodeOptions> = [
  FILE_GLOB,
  async (configFiles, options, context: CreateNodesContextV2) => {
    const pluginSetup = new Map<string, boolean>();
    return await createNodesFromFiles(
      async (configPath) => {
        const root = dirname(configPath);

        if (pluginSetup.has(root)) return { projects: {} };
        pluginSetup.set(root, true);

        const cfg = await loadMergedProjectConfig(root, context.workspaceRoot);

        const { targets, namedInputs = {} } = createProjectConfiguration(
          cfg,
          normalizeCreateNodesOptions(options)
        );

        return { projects: { [root]: { namedInputs, targets } } };
      },
      configFiles,
      options,
      context
    );
  },
];

export const createNodes: CreateNodes<NxVerdaccioCreateNodeOptions> = [
  PROJECT_JSON_FILE_GLOB,
  (projectConfigurationFile, options) => {
    logger.info(
      '`createNodes` is deprecated. Update Nx utilize createNodesV2 instead.'
    );
    const projectRoot = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      join(process.cwd(), projectConfigurationFile)
    );
    return {
      projects: {
        [projectRoot]: {
          targets: createProjectConfiguration(projectConfiguration, options)
            .targets,
        },
      },
    };
  },
];
