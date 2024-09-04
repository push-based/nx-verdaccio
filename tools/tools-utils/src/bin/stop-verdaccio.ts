import {
  verdaccioEnvLogger,
  StartVerdaccioAndSetupEnvOptions,
} from '../lib/verdaccio/verdaccio-npm-env';
import yargs, { Options } from 'yargs';
import { join } from 'node:path';
import { readJsonFile } from '@nx/devkit';
import { VercaddioServerResult } from '../lib/verdaccio/verdaccio-registry';
import { rm } from 'node:fs/promises';

const isVerbose: boolean =
  process.env['NX_VERBOSE_LOGGING'] === 'true' ?? false;
const { info, error } = verdaccioEnvLogger;

const args = yargs(process.argv.slice(2))
  .version(false)
  .options({
    workspaceRoot: {
      type: 'string',
      demandOption: true,
      description: 'Location of test environment',
    },
    projectName: {
      type: 'string',
      description: 'Verbose logging',
      default: isVerbose,
    },
    verbose: {
      type: 'boolean',
      description: 'Verbose logging',
      default: isVerbose,
    },
  } satisfies Partial<Record<keyof StartVerdaccioAndSetupEnvOptions, Options>>)
  .parse() as StartVerdaccioAndSetupEnvOptions & { workspaceRoot: string };

(async () => {
  const { workspaceRoot } = args;
  const registryConfigPath = join(workspaceRoot, 'verdaccio-registry.json');
  let registryServerResult: VercaddioServerResult;
  try {
    registryServerResult = await readJsonFile<VercaddioServerResult>(
      registryConfigPath
    );
  } catch (e) {
    error(`No registry config file found at: ${registryConfigPath}`);
    return;
  }

  info('Tearing down environment');
  console.table(registryServerResult);
  const { pid, storage } = registryServerResult;
  await rm(storage, { recursive: true, force: true });
  try {
    process.kill(Number(pid));
  } catch (e) {
    error(`Failed killing process with id: ${pid}\n${e}`);
  } finally {
    await rm(registryConfigPath);
  }
})();
