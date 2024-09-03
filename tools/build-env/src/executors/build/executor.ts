import {type ExecutorContext, logger} from '@nx/devkit';
// eslint-disable-next-line n/no-sync
import type {BuildExecutorOptions} from './schema';
import {setupNpmEnv} from "../../internal/verdaccio/verdaccio-npm-env";
import {join} from "node:path";

export type ExecutorOutput = {
  success: boolean;
  command?: string;
  error?: Error;
};

export default async function runBuildExecutor(
  terminalAndExecutorOptions: BuildExecutorOptions,
  context: ExecutorContext,
) {

  const {projectName} = context;
  const normalizedOptions = {
    ...terminalAndExecutorOptions,
    workspaceRoot: join('tmp', 'environments', projectName)
  };
  logger.info(`Execute @org/build-env:build with options: ${JSON.stringify(terminalAndExecutorOptions, null, 2)}`);
  try {
  const envResult = await setupNpmEnv(normalizedOptions)
  logger.info(`envResult: ${JSON.stringify(envResult, null, 2)}`);
  } catch (error) {
    logger.error(error);
  }
  return Promise.resolve({
    success: true,
    command: '????????',
  } satisfies ExecutorOutput);
}
