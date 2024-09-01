import { join } from 'node:path';
import {
  Registry,
  startVerdaccioServer,
  StarVerdaccioOptions,
} from './registry';
import { rm } from 'node:fs/promises';
import { configureRegistry, setupNpmWorkspace } from './npm';

export type VerdaccioEnv = {
  workspaceRoot: string;
};

export type StartVerdaccioAndSetupEnvOptions = Partial<
  StarVerdaccioOptions & VerdaccioEnv
> &
  Pick<StarVerdaccioOptions, 'projectName'>;

export type NpmTestEnvResult = VerdaccioEnv & {
  registry: Registry;
  stop: () => void;
};

export async function startNpmEnv({
  projectName,
  targetName,
  port,
  verbose = false,
  workspaceRoot = '.',
  location = 'none',
  // reset or remove cached packages and/or metadata.
  clear = true,
}: StartVerdaccioAndSetupEnvOptions): Promise<NpmTestEnvResult> {
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

  return {
    ...registryResult,
    workspaceRoot,
  } satisfies NpmTestEnvResult;
}

export async function stopVerdaccioAndTeardownEnv(result: NpmTestEnvResult) {
  const { stop, workspaceRoot } = result;
  stop();
  await rm(workspaceRoot, { recursive: true, force: true });
}
