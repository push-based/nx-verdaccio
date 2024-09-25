import {
  type CreateNodes,
  CreateNodesContext,
  createNodesFromFiles,
  CreateNodesResult,
  CreateNodesV2,
  logger,
  type ProjectConfiguration,
  readJsonFile,
  writeJsonFile,
} from '@nx/devkit';
import { existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { BuildEnvPluginCreateNodeOptions } from './schema';
import { normalizeCreateNodesOptions } from './normalize-create-nodes-options';
import { hashObject } from 'nx/src/hasher/file-hasher';
import {
  getEnvTargets,
  isEnvProject,
  updateEnvTargetNames,
  verdaccioTargets,
} from './targets/environment.targets';
import { getPkgTargets, isPkgProject } from './targets/package.targets';
import { workspaceDataDirectory } from 'nx/src/utils/cache-directory';
import { PLUGIN_NAME } from './constants';

function readTargetsCache(
  cachePath: string
): Record<string, CreateNodesResult['projects']> {
  return process.env.NX_CACHE_PROJECT_GRAPH !== 'false' && existsSync(cachePath)
    ? readJsonFile(cachePath)
    : {};
}

function writeTargetsToCache(
  cachePath: string,
  results: Record<string, CreateNodesResult['projects']>
) {
  writeJsonFile(cachePath, results);
}

const CREATE_NODES_FILE_GLOB = '**/project.json';

export const createNodesV2: CreateNodesV2<BuildEnvPluginCreateNodeOptions> = [
  CREATE_NODES_FILE_GLOB,
  async (configFiles, options, context) => {
    logger.info('`createNodesV2` is used.');
    const normalizedOptions = normalizeCreateNodesOptions(options);
    const optionsHash = hashObject(normalizedOptions);
    const cachePath = join(
      workspaceDataDirectory,
      `push-based--${PLUGIN_NAME}-${optionsHash}.hash`
    );
    const targetsCache = readTargetsCache(cachePath);
    try {
      return await createNodesFromFiles(
        (configFile, internalOptions, context) =>
          createNodesInternal(
            configFile,
            internalOptions,
            context,
            targetsCache
          ),
        configFiles,
        options,
        context
      );
    } finally {
      writeTargetsToCache(cachePath, targetsCache);
    }
  },
];

export const createNodes: CreateNodes = [
  CREATE_NODES_FILE_GLOB,
  (
    projectConfigurationFile: string,
    options: BuildEnvPluginCreateNodeOptions,
    context: CreateNodesContext
  ) => {
    logger.warn(
      '`createNodes` is deprecated. Update your plugin to utilize createNodesV2 instead. In Nx 20, this will change to the createNodesV2 API.'
    );
    const normalizedOptions = normalizeCreateNodesOptions(options);
    return createNodesInternal(
      projectConfigurationFile,
      normalizedOptions,
      context,
      {}
    );
  },
];

async function createNodesInternal(
  projectConfigurationFile: string,
  options: BuildEnvPluginCreateNodeOptions,
  context: CreateNodesContext,
  targetsCache?: Record<string, CreateNodesResult['projects']>
): Promise<CreateNodesResult> {
  const { environments, packages } = normalizeCreateNodesOptions(options);

  const projectConfiguration: ProjectConfiguration = readJsonFile(
    join(process.cwd(), projectConfigurationFile)
  );

  if (
    !('name' in projectConfiguration) ||
    typeof projectConfiguration.name !== 'string'
  ) {
    throw new Error('Project name is required');
  }
  const projectRoot = dirname(projectConfigurationFile);

  const projectFolder = basename(dirname(projectConfigurationFile));
  const cacheKey = `${projectFolder}-${hashObject({
    options,
    projectConfigurationFile,
    context,
  })}`;

  if (targetsCache[cacheKey]) {
    return {
      projects: {
        [projectRoot]: {
          targets: targetsCache[cacheKey],
        },
      },
    };
  }

  if (
    !isEnvProject(projectConfiguration, environments) &&
    !isPkgProject(projectConfiguration, packages)
  ) {
    return {};
  }

  const targets = {
    // === environment targets ===
    ...(isEnvProject(projectConfiguration, environments) && {
      // start-verdaccio, stop-verdaccio
      ...verdaccioTargets(projectConfiguration, {
        environmentsDir: environments.environmentsDir,
      }),
      // bootstrap-env, setup-env, install-env (intermediate target to run dependency targets)
      ...getEnvTargets(projectConfiguration, environments),
      // adjust targets to run setup-env
      ...updateEnvTargetNames(projectConfiguration, environments),
    }),
    // === package targets ===
    // npm-publish, npm-install
    ...(isPkgProject(projectConfiguration, packages) && getPkgTargets()),
  };

  targetsCache[cacheKey] = targets;

  return {
    projects: {
      [projectRoot]: {
        targets,
      },
    },
  };
}
