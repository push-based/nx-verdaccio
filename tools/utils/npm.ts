import {bgBlue, bold, gray, red, whiteBright} from 'ansis';
import {execFileSync, execSync} from 'node:child_process';
import {join} from 'node:path';
import {objectToCliArgs} from '@org/test-utils';
import {VerdaccioProcessResult} from './registry';
import {ensureDirectoryExists} from './utils';

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
    console.info(
      `${bgBlue(
        whiteBright(bold(' Verdaccio-Env '))
      )} Set registry:\n${setRegistry}`
    );
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
    console.info(
      `${gray('>')} ${gray(
        bold('Verdaccio-Env')
      )} Set authToken:\n${setAuthToken}`
    );
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
    console.info(
      `${gray('>')} ${gray(
        bold('Verdaccio-Env')
      )} Delete authToken:\n${setAuthToken}`
    );
  }
  execSync(setAuthToken);

  const setRegistry = `npm config delete registry ${objectToCliArgs({
    userconfig,
  }).join(' ')}`;
  if (verbose) {
    console.info(
      `${gray('>')} ${gray(
        bold('Verdaccio-Env')
      )} Delete registry:\n${setRegistry}`
    );
  }
  execSync(setRegistry);
}

export async function setupNpmWorkspace(directory: string, verbose?: boolean) {
  if (verbose) {
    console.info(
      `${gray('>')} ${gray(
        bold('Verdaccio-Env')
      )} Execute: npm init in directory ${directory}`
    );
  }
  const cwd = process.cwd();
  await ensureDirectoryExists(directory);
  process.chdir(join(cwd, directory));
  try {
    execFileSync('npm', ['init', '--force']).toString();
  } catch (error) {
    console.error(
      `${red('>')} ${red(
        bold('Verdaccio-Env')
      )} Error creating NPM workspace: ${(error as Error).message}`
    );
  } finally {
    process.chdir(cwd);
  }
}
