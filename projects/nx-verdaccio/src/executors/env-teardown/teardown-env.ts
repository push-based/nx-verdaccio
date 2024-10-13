import {Environment} from "../env-bootstrap/npm";
import {simpleGit, type SimpleGit} from "simple-git";
import {isFolderInRepo} from "./git";
import {ExecutorContext, logger} from "@nx/devkit";
import {runSingleExecutor} from "../../internal/run-executor";
import {join} from "node:path";
import {VERDACCIO_REGISTRY_JSON} from "../env-bootstrap/constants";
import {TARGET_ENVIRONMENT_VERDACCIO_STOP} from "@push-based/nx-verdaccio";
import {fileExists} from "../../internal/file-system";

export const gitClient: SimpleGit = simpleGit(process.cwd());
export type TeardownEnvironmentOptions = Environment & { verbose?: boolean };

export async function teardownEnvironment(
  context: ExecutorContext,
  options: TeardownEnvironmentOptions,
  git: SimpleGit = gitClient
): Promise<void> {
  const {verbose, environmentRoot} = options;

  // kill verdaccio process if running
  const registryJsonExists = await fileExists(join(environmentRoot, VERDACCIO_REGISTRY_JSON));
  if (registryJsonExists) {
    await runSingleExecutor(
      {
        project: context.projectName,
        target: TARGET_ENVIRONMENT_VERDACCIO_STOP,
      },
      {
        ...(verbose ? {verbose} : {}),
        filePath: join(environmentRoot, VERDACCIO_REGISTRY_JSON),
      },
      context
    );
  } else {
    logger.info(`No verdaccio-registry.json file found in ${environmentRoot}.`);
  }

  // clean environmentRoot

  const environmentRootInRepo = await isFolderInRepo(environmentRoot);
    if (environmentRootInRepo) {
    await git.checkout([environmentRoot]);
    logger.info(`Cleaned git history in ${environmentRoot}.`);
  } else {
    try {

    } catch (error) {
     // throw new Error(`Error cleaning history of folder ${environmentRoot}. ${error.message}`);
    }
  }


}
