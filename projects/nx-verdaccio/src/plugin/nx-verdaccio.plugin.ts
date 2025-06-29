import {
  type CreateNodes,
  createNodesFromFiles,
  type CreateNodesV2,
  logger,
  type ProjectConfiguration,
  readJsonFile,
} from '@nx/devkit';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { hashObject } from 'nx/src/hasher/file-hasher';
import { workspaceDataDirectory } from 'nx/src/utils/cache-directory';
import {
  getCacheRecord,
  readTargetsCache,
  setCacheRecord,
  writeTargetsToCache,
} from './caching';
import { PLUGIN_NAME } from './constants';
import { normalizeCreateNodesOptions } from './normalize-create-nodes-options';
import type { NxVerdaccioCreateNodeOptions } from './schema';
import { createProjectConfiguration } from './targets/create-targets';

const PROJECT_JSON_FILE_GLOB = '**/project.json';

export const createNodesV2: CreateNodesV2<NxVerdaccioCreateNodeOptions> = [
  PROJECT_JSON_FILE_GLOB,
  async (configFiles, options, context) => {
    const optionsHash = hashObject({ options: options ?? {} });
    const nxVerdaccioEnvPluginCachePath = join(
      workspaceDataDirectory,
      `push-based--${PLUGIN_NAME}-${optionsHash}.hash`
    );
    const targetsCache = readTargetsCache(nxVerdaccioEnvPluginCachePath);
    try {
      return await createNodesFromFiles(
        async (projectConfigurationFile, internalOptions) => {
          const projectConfiguration: ProjectConfiguration = await readFile(
            join(process.cwd(), projectConfigurationFile),
            'utf8'
          ).then(JSON.parse);
          if (
            !('name' in projectConfiguration) ||
            typeof projectConfiguration.name !== 'string'
          ) {
            throw new Error('Project name is required');
          }

          const normalizedOptions = normalizeCreateNodesOptions(options);
          const projectRoot = dirname(projectConfigurationFile);
          const hashData = {
            projectRoot,
            internalOptions,
          };
          let cachedProjectConfiguration = getCacheRecord<
            Partial<ProjectConfiguration>
          >(targetsCache, projectRoot, hashData);

          if (cachedProjectConfiguration === undefined) {
            cachedProjectConfiguration = createProjectConfiguration(
              projectConfiguration,
              normalizedOptions
            );
            if (cachedProjectConfiguration.targets) {
              setCacheRecord(
                targetsCache,
                projectRoot,
                hashData,
                cachedProjectConfiguration
              );
            }
          }
          const { targets, namedInputs = {} } = cachedProjectConfiguration;
          return {
            projects: {
              [projectRoot]: {
                namedInputs,
                targets,
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
