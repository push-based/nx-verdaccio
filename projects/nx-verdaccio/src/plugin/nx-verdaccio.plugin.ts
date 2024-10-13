import {
  type CreateNodes,
  type CreateNodesContext,
  createNodesFromFiles,
  type CreateNodesV2,
  logger,
  type ProjectConfiguration,
  readJsonFile,
  type TargetConfiguration,
} from '@nx/devkit';
import { dirname, join } from 'node:path';
import type { NxVerdaccioCreateNodeOptions } from './schema';
import {
  normalizeCreateNodesOptions,
  type NormalizedCreateNodeOptions,
} from './normalize-create-nodes-options';
import { hashObject } from 'nx/src/hasher/file-hasher';
import { workspaceDataDirectory } from 'nx/src/utils/cache-directory';
import { PLUGIN_NAME } from './constants';
import {
  getCacheRecord,
  readTargetsCache,
  setCacheRecord,
  writeTargetsToCache,
} from './caching';
import { createTargets } from './targets/create-targets';

const PROJECT_JSON_FILE_GLOB = '**/project.json';

export const createNodesV2: CreateNodesV2<NxVerdaccioCreateNodeOptions> = [
  PROJECT_JSON_FILE_GLOB,
  async (configFiles, options, context) => {
    const normalizedOptions = normalizeCreateNodesOptions(options);
    const optionsHash = hashObject({ options: options ?? {} });
    const nxVerdaccioEnvPluginCachePath = join(
      workspaceDataDirectory,
      `push-based--${PLUGIN_NAME}-${optionsHash}.hash`
    );
    const targetsCache = readTargetsCache(nxVerdaccioEnvPluginCachePath);
    try {
      return await createNodesFromFiles(
        (projectConfigurationFile, internalOptions) => {
          const projectConfiguration: ProjectConfiguration = readJsonFile(
            join(process.cwd(), projectConfigurationFile)
          );
          const projectRoot = dirname(projectConfigurationFile);
          const hashData = {
            projectRoot,
            internalOptions,
          };
          if (
            !('name' in projectConfiguration) ||
            typeof projectConfiguration.name !== 'string'
          ) {
            throw new Error('Project name is required');
          }

          let cachedProjectTargets = getCacheRecord<
            Record<string, TargetConfiguration>
          >(targetsCache, projectRoot, hashData);

          if (cachedProjectTargets === undefined) {
            cachedProjectTargets = createTargets(
              projectConfiguration,
              normalizedOptions
            );
            setCacheRecord(
              targetsCache,
              projectRoot,
              hashData,
              cachedProjectTargets
            );
          }

          return {
            projects: {
              [projectRoot]: {
                targets: cachedProjectTargets,
              },
            },
          };
        },
        configFiles,
        options,
        context
      );
    } finally {
      writeTargetsToCache(nxVerdaccioEnvPluginCachePath, targetsCache);
    }
  },
];

export const createNodes: CreateNodes = [
  PROJECT_JSON_FILE_GLOB,
  (
    projectConfigurationFile: string,
    options: NormalizedCreateNodeOptions,
    context: CreateNodesContext
  ) => {
    logger.warn(
      '`createNodes` is deprecated. Update Nx utilize createNodesV2 instead.'
    );
    const projectRoot = dirname(projectConfigurationFile);
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      join(process.cwd(), projectConfigurationFile)
    );
    return {
      projects: {
        [projectRoot]: {
          targets: createTargets(projectConfiguration, options),
        },
      },
    };
  },
];
