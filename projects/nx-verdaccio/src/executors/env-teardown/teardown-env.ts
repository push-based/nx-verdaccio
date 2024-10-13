import {Environment} from "../env-bootstrap/npm";
import {simpleGit, type SimpleGit} from "simple-git";
import {isFolderInRepo} from "./git";
import {ExecutorContext, logger} from "@nx/devkit";
import {join} from "node:path";
import {VERDACCIO_REGISTRY_JSON} from "../env-bootstrap/constants";
import {fileExists} from "../../internal/file-system";
import {rm} from "node:fs/promises";
import runKillProcessExecutor from "../kill-process/executor";

export const gitClient: SimpleGit = simpleGit(process.cwd());
export type TeardownEnvironmentOptions = Environment & { verbose?: boolean };

export async function teardownEnvironment(
  context: ExecutorContext,
  options: TeardownEnvironmentOptions,
  git: SimpleGit = gitClient
): Promise<void> {
  const { environmentRoot} = options;

  // kill verdaccio process if running
  const registryPath = join(environmentRoot, VERDACCIO_REGISTRY_JSON);
  const registryJsonExists = await fileExists(registryPath);
  if (registryJsonExists) {
    await runKillProcessExecutor({...options, filePath: registryPath});
  } else {
    logger.info(`No verdaccio-registry.json file found in ${environmentRoot}.`);
  }

  // clean environmentRoot
  const environmentRootInRepo = await isFolderInRepo(environmentRoot);
  if (environmentRootInRepo && environmentRootInRepo !== '.') {
    await git.checkout([environmentRoot]);
    await git.clean('f', [environmentRoot]);
    logger.info(`Cleaned git history in ${environmentRoot}.`);
  } else {
    try {
      const registryFiles = [
        join(environmentRoot)
      ];
      await rm(environmentRoot, {recursive: true, force: true, retryDelay: 100, maxRetries: 2});
      logger.info(`deleted folder ${environmentRoot}.`);
    } catch (error) {
      throw new Error(`Error cleaning history of folder ${environmentRoot}. ${error.message}`);
    }
  }


}
