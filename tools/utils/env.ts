import { join } from 'node:path';
import {
  VercaddioServerResult,
  startVerdaccioServer,
  StarVerdaccioOptions,
} from './registry';
import { rm, writeFile } from 'node:fs/promises';
import { configureRegistry, setupNpmWorkspace } from './npm';

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

  console.info(
    `Save active verdaccio registry data to file: ${join(
      activeRegistry.workspaceRoot
    )}`
  );
  await writeFile(
    join(activeRegistry.workspaceRoot, 'verdaccio-registry.json'),
    JSON.stringify(activeRegistry.registry, null, 2)
  );
  console.info(
    `Environment ready under: ${join(activeRegistry.workspaceRoot)}`
  );

  return activeRegistry;
}

export async function stopVerdaccioAndTeardownEnv(result: NpmTestEnvResult) {
  const { stop, workspaceRoot } = result;
  stop();
  await rm(workspaceRoot, { recursive: true, force: true });
}
