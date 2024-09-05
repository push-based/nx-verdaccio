import { join } from 'node:path';
import {
  startVerdaccioServer,
  type StarVerdaccioOptions,
  type VercaddioServerResult,
  type VerdaccioProcessResult,
} from './verdaccio-registry';
import { writeFile } from 'node:fs/promises';
import { setupNpmWorkspace } from '../utils/npm';
import { error, info } from '../utils/logging';
import { objectToCliArgs } from '../utils/terminal-command';
import { execSync } from 'node:child_process';

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
  root: string;
};

export type BootstrapEnvironmentOptions = Partial<
  StarVerdaccioOptions & Environment
> &
  Required<Pick<StarVerdaccioOptions, 'projectName'>>;

export type BootstrapEnvironmentResult = Environment & {
  registry: VercaddioServerResult;
  stop: () => void;
};

export async function bootstrapEnvironment({
  verbose = false,
  environmentRoot,
  ...opts
}: BootstrapEnvironmentOptions & {
  environmentRoot: string;
}): Promise<BootstrapEnvironmentResult> {
  const storage = join(environmentRoot, 'storage');
  const registryResult = await startVerdaccioServer({
    storage,
    verbose,
    ...opts,
  });

  // set up NPM workspace environment
  await setupNpmWorkspace(environmentRoot, verbose);
  const userconfig = join(environmentRoot, '.npmrc');
  configureRegistry({ ...registryResult.registry, userconfig }, verbose);

  const activeRegistry: BootstrapEnvironmentResult = {
    ...registryResult,
    root: environmentRoot,
  };

  logInfo(
    `Save active verdaccio registry data to file: ${activeRegistry.root}`
  );
  await writeFile(
    join(activeRegistry.root, 'verdaccio-registry.json'),
    JSON.stringify(activeRegistry.registry, null, 2)
  );

  logInfo(`Environment ready under: ${activeRegistry.root}`);

  return activeRegistry;
}

/**
 * configure env with verdaccio registry as default
 * exec commands:
 * - `npm config set registry "${url}"
 * - `npm config set //${host}:${port}/:_authToken "secretVerdaccioToken"`
 * @see {@link VerdaccioProcessResult}
 */
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

/**
 * unconfigure env with verdaccio registry as default
 * exec commands:
 * - `npm config delete //${host}:${port}/:_authToken`
 * - `npm config delete registry`
 * @see {@link VerdaccioProcessResult}
 **/
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
