import {
  type CreateNodes,
  CreateNodesContextV2,
  createNodesFromFiles,
  CreateNodesResult,
  type CreateNodesV2,
  logger,
  type ProjectConfiguration,
  readJsonFile,
} from '@nx/devkit';
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
import {
  getPackageJsonNxConfig,
  getProjectConfig,
  getProjectJsonNxConfig,
} from './project-config';
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
    const optionsHash = hashObject({ options: options ?? {} });
    const nxVerdaccioEnvPluginCachePath = join(
      workspaceDataDirectory,
      `push-based--${PLUGIN_NAME}-${optionsHash}.hash`
    );
    const targetsCache = readTargetsCache(nxVerdaccioEnvPluginCachePath);

    // key is projectRoot, value is true if the project was already processed
    const pluginSetup = new Map();
    try {
      return await createNodesFromFiles(
        async (projectConfigurationFile, internalOptions) => {
          if (pluginSetup.has(dirname(projectConfigurationFile)) === true) {
            return {
              projects: {},
            } as CreateNodesResult;
          }

          const isPkgJson = projectConfigurationFile.endsWith('package.json');
          pluginSetup.set(dirname(projectConfigurationFile), true);
          const [primaryConfig, fallback] = isPkgJson
            ? [getPackageJsonNxConfig, getProjectJsonNxConfig]
            : [getProjectJsonNxConfig, getPackageJsonNxConfig];

          const projectConfiguration: ProjectConfiguration =
            await getProjectConfig(
              projectConfigurationFile,
              primaryConfig,
              fallback
            );
          if (
            !('name' in projectConfiguration) ||
            typeof projectConfiguration.name !== 'string'
          ) {
            // Skip processing files that don't have valid project configurations
            // (e.g., workspace root package.json with no project.json)
            return {
              projects: {},
            } as CreateNodesResult;
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
