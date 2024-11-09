import { type Environment } from '../env-bootstrap/npm';
import { simpleGit, type SimpleGit } from 'simple-git';
import { isFolderInGit } from './git';
import { type ExecutorContext, logger } from '@nx/devkit';
import { join } from 'node:path';
import { VERDACCIO_REGISTRY_JSON } from '../env-bootstrap/constants';
import { fileExists } from '../../internal/file-system';
import { rm } from 'node:fs/promises';
import runKillProcessExecutor from '../kill-process/executor';
import { getEnvironmentRoot } from '../../internal/environment-root';

export const gitClient: SimpleGit = simpleGit(process.cwd());
export type TeardownEnvironmentOptions = Environment & { verbose?: boolean };

export async function teardownEnvironment(
  context: ExecutorContext,
  options: TeardownEnvironmentOptions
): Promise<void> {
  const environmentRoot = getEnvironmentRoot(context, options);
  // kill verdaccio process if running
  const registryPath = join(environmentRoot, VERDACCIO_REGISTRY_JSON);
  const registryJsonExists = await fileExists(registryPath);
  if (registryJsonExists) {
    await runKillProcessExecutor({ ...options, filePath: registryPath });
  } else {
    logger.info(`No verdaccio-registry.json file found in ${environmentRoot}`);
  }

  if (environmentRoot === '.') {
    logger.info(`Skip teardown environment in root folder`);
    return;
  }

  const environmentRootInRepo = await isFolderInGit(environmentRoot);
  if (environmentRootInRepo) {
    await gitClient.checkout([environmentRoot]);
    await gitClient.clean('f', [environmentRoot]);
    logger.info(`Cleaned git history in ${environmentRoot}`);

    const nodeModules = join(environmentRoot, 'node_modules');
    try {
      await rm(nodeModules, {
        recursive: true,
        force: true,
        retryDelay: 100,
        maxRetries: 2,
      });
      logger.info(`deleted folder ${nodeModules}.`);
    } catch (error) {
      throw new Error(
        `Error cleaning history of folder ${nodeModules}. ${error.message}`
      );
    }
  } else {
    try {
      await rm(environmentRoot, {
        recursive: true,
        force: true,
        retryDelay: 100,
        maxRetries: 2,
      });
      logger.info(`deleted folder ${environmentRoot}.`);
    } catch (error) {
      throw new Error(
        `Error cleaning history of folder ${environmentRoot}. ${error.message}`
      );
    }
  }
}
