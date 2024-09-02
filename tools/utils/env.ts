import { join } from 'node:path';
import {
  startVerdaccioServer,
  StarVerdaccioOptions,
  VercaddioServerResult,
  VerdaccioProcessResult,
} from './registry';
import { rm, writeFile } from 'node:fs/promises';
import { setupNpmWorkspace } from './npm';
import { error, info } from './logging';
import { objectToCliArgs } from '../../testing/test-utils/src';
import { execSync } from 'node:child_process';

export function logInfo(msg: string) {
  info(msg, 'Verdaccio Env: ');
}

export function logError(msg: string) {
  error(msg, 'Verdaccio Env: ');
}

export type VerdaccioEnv = {
  workspaceRoot: string;
};

export type StartVerdaccioAndSetupEnvOptions = Partial<
  StarVerdaccioOptions & VerdaccioEnv
> &
  Pick<StarVerdaccioOptions, 'projectName'>;

export type NpmTestEnvResult = VerdaccioEnv & {
  registry: VercaddioServerResult;
  stop: () => void;
};

export async function startNpmEnv({
  projectName,
  verbose = false,
  targetName = 'start-verdaccio',
  workspaceRoot = join('tmp', 'npm-env', projectName),
  location = 'none',
  port,
  clear,
}: StartVerdaccioAndSetupEnvOptions): Promise<NpmTestEnvResult> {
  if (verbose) {
    console.info(
      `Start NPM environment with params: ${{
        projectName,
        verbose,
        targetName,
        workspaceRoot,
        location,
        port,
        clear,
      }}`
    );
  }
  const storage = join(workspaceRoot, 'storage');
  const registryResult = await startVerdaccioServer({
    targetName,
    projectName,
    storage,
    port,
    location,
    clear,
    verbose,
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

export async function stopVerdaccioAndTeardownEnv(result: NpmTestEnvResult) {
  const { stop, workspaceRoot } = result;
  stop();
  await rm(workspaceRoot, { recursive: true, force: true });
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
