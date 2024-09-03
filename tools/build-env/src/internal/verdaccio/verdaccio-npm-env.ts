import { basename, join } from 'node:path';
import {
  startVerdaccioServer,
  type StarVerdaccioOptions,
  type VercaddioServerResult,
  type VerdaccioProcessResult,
} from './verdaccio-registry';
import { rm, writeFile } from 'node:fs/promises';
import { setupNpmWorkspace } from '../utils/npm';
import { error, info } from '../utils/logging';
import { objectToCliArgs } from '../utils/terminal-command';
import { execSync } from 'node:child_process';
import runKillProcessExecutor from '../../executors/kill-process/executor';
import { boolean } from 'yargs';
import * as process from 'process';
import { logger } from '@nx/devkit';

function logInfo(msg: string) {
  info(msg, 'Verdaccio Env: ');
}

function errorLog(msg: string) {
  error(msg, 'Verdaccio Env: ');
}

export const verdaccioEnvLogger = {
  info: logInfo,
  error: errorLog,
};

export type Environment = {
  workspaceRoot: string;
};

export type StartVerdaccioAndSetupEnvOptions = Partial<
  StarVerdaccioOptions & Environment
> &
  Required<Pick<StarVerdaccioOptions, 'projectName'>>;

export type NpmTestEnvResult = Environment & {
  registry: VercaddioServerResult;
  stop: () => void;
};

export async function setupNpmEnv({
  verbose = false,
  workspaceRoot,
  ...opts
}: StartVerdaccioAndSetupEnvOptions & {
  workspaceRoot: string;
}): Promise<NpmTestEnvResult> {
  const storage = join(workspaceRoot, 'storage');

  const registryResult = await startVerdaccioServer({
    storage,
    verbose,
    ...opts,
  });

  // set up NPM workspace environment
  await setupNpmWorkspace(workspaceRoot, verbose);
  const userconfig = join(workspaceRoot, '.npmrc');
  configureRegistry({ ...registryResult.registry, userconfig }, verbose);

  const activeRegistry: NpmTestEnvResult = {
    ...registryResult,
    workspaceRoot,
  };

  logInfo(
    `Save active verdaccio registry data to file: ${activeRegistry.workspaceRoot}`
  );
  await writeFile(
    join(activeRegistry.workspaceRoot, 'verdaccio-registry.json'),
    JSON.stringify(activeRegistry.registry, null, 2)
  );

  logInfo(`Environment ready under: ${activeRegistry.workspaceRoot}`);

  return activeRegistry;
}

export function configureRegistry(
  {
    port,
    host,
    url,
    userconfig,
  }: VerdaccioProcessResult & { userconfig?: string },
  verbose?: boolean
) {
  const setRegistry = `npm config set registry="${url}" ${objectToCliArgs({
    userconfig,
  }).join(' ')}`;
  if (verbose) {
    logInfo(`Set registry:\n${setRegistry}`);
  }
  execSync(setRegistry);

  /**
   * Protocol-Agnostic Configuration: The use of // allows NPM to configure authentication for a registry without tying it to a specific protocol (http: or https:).
   * This is particularly useful when the registry might be accessible via both HTTP and HTTPS.
   *
   * Example: //registry.npmjs.org/:_authToken=your-token
   */
  const urlNoProtocol = `//${host}:${port}`;
  const token = 'secretVerdaccioToken';
  const setAuthToken = `npm config set ${urlNoProtocol}/:_authToken "${token}" ${objectToCliArgs(
    { userconfig }
  ).join(' ')}`;
  if (verbose) {
    logInfo(`Set authToken:\n${setAuthToken}`);
  }
  execSync(setAuthToken);
}

export function unconfigureRegistry(
  { port, host, userconfig }: VerdaccioProcessResult & { userconfig?: string },
  verbose?: boolean
) {
  const urlNoProtocol = `//${host}:${port}`;
  const setAuthToken = `npm config delete ${urlNoProtocol}/:_authToken ${objectToCliArgs(
    { userconfig }
  ).join(' ')}`;
  if (verbose) {
    logInfo(`Delete authToken:\n${setAuthToken}`);
  }
  execSync(setAuthToken);

  const setRegistry = `npm config delete registry ${objectToCliArgs({
    userconfig,
  }).join(' ')}`;
  if (verbose) {
    logInfo(`Delete registry:\n${setRegistry}`);
  }
  execSync(setRegistry);
}
