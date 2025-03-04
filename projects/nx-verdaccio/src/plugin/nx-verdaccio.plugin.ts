import {
  type CreateNodes,
  type CreateNodesContext,
  createNodesFromFiles,
  type CreateNodesV2,
  logger,
  type ProjectConfiguration,
  readJsonFile,
} from '@nx/devkit';
import { readFile } from 'node:fs/promises';
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
import { createProjectConfiguration } from './targets/create-targets';
import { combineGlobPatterns } from 'nx/src/utils/globs';
import { getProjectConfig } from './project-config';

const PROJECT_JSON_FILE_GLOB = '**/project.json';
const PACKAGE_JSON_FILE_GLOB = '**/package.json';
const GLOB_PATTERN = combineGlobPatterns(
  PROJECT_JSON_FILE_GLOB,
  PACKAGE_JSON_FILE_GLOB
);

export const createNodesV2: CreateNodesV2<NxVerdaccioCreateNodeOptions> = [
  GLOB_PATTERN,
  async (configFiles, options, context) => {
    const isVisited = new Map<string, boolean>();

    const optionsHash = hashObject({ options: options ?? {} });
    const nxVerdaccioEnvPluginCachePath = join(
      workspaceDataDirectory,
      `push-based--${PLUGIN_NAME}-${optionsHash}.hash`
    );
    const targetsCache = readTargetsCache(nxVerdaccioEnvPluginCachePath);
    try {
      return await createNodesFromFiles(
        async (globMatchingFile, internalOptions) => {
          if (isVisited.has(dirname(globMatchingFile))) {
            return {};
          }
          // Unexpected token 'g', "getProject"... is not valid JSON
          // Project lib-a-e2e is an environment project but has no implicit dependencies.
          const projectConfiguration: ProjectConfiguration = await getProjectConfig(globMatchingFile);

          isVisited.set(dirname(globMatchingFile), true);
          if (
            !('name' in projectConfiguration) ||
            typeof projectConfiguration.name !== 'string'
          ) {
            throw new Error('Project name is required');
          }

          const normalizedOptions = normalizeCreateNodesOptions(options);
          const projectRoot = dirname(globMatchingFile);
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

export const createNodes: CreateNodes = [
  PROJECT_JSON_FILE_GLOB,
  (
    projectConfigurationFile: string,
    options: NormalizedCreateNodeOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: CreateNodesContext
  ) => {
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

function isValidProjectConfig(
  projectConfiguration: ProjectConfiguration
): projectConfiguration is Omit<ProjectConfiguration, 'name'> & {
  name: string;
} {
  if (
    !('name' in projectConfiguration) ||
    typeof projectConfiguration.name !== 'string'
  ) {
    throw new Error('Project name is required');
  }
  return true;
}
