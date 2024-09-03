import {
  logError,
  logInfo,
  setupNpmEnv,
  StartVerdaccioAndSetupEnvOptions,
} from '../utils/env';
import yargs, { Options } from 'yargs';
import { join } from 'node:path';
import { readJsonFile } from '@nx/devkit';
import { VercaddioServerResult } from '../utils/registry';
import { rm } from 'node:fs/promises';

const isVerbose: boolean = process.env.NX_VERBOSE_LOGGING === 'true' ?? false;

const args = yargs(process.argv.slice(2))
  .version(false)
  .options({
    workspaceRoot: {
      type: 'string',
      description: 'Location of test environment',
    },
    verbose: {
      type: 'boolean',
      description: 'Verbose logging',
      default: isVerbose,
    },
  } satisfies Partial<Record<keyof StartVerdaccioAndSetupEnvOptions, Options>>)
  .parse() as StartVerdaccioAndSetupEnvOptions;

(async () => {
  const { workspaceRoot } = args;
  const registryConfigPath = join(workspaceRoot, 'verdaccio-registry.json');
  let registryServerResult: VercaddioServerResult;
  try {
    registryServerResult = await readJsonFile<VercaddioServerResult>(
      registryConfigPath
    );
  } catch (e) {
    logError(`No registry config file found at: ${registryConfigPath}`);
    return;
  }

  logInfo('Tearing down environment');
  console.table(registryServerResult);
  const { pid, storage } = registryServerResult;
  await rm(storage, { recursive: true, force: true });
  try {
    process.kill(Number(pid));
  } catch (e) {
    logError(`Failes kipplng process with id: ${pid}\n${e}`);
  } finally {
    await rm(registryConfigPath);
  }
})();
