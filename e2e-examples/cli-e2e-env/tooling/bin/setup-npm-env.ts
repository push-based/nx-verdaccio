import yargs, { Options } from 'yargs';
import {
  setupNpmEnv,
  StartVerdaccioAndSetupEnvOptions,
} from '@org/tools-utils';

const isVerbose: boolean =
  process.env['NX_VERBOSE_LOGGING'] === 'true' ?? false;

const args = yargs(process.argv.slice(2))
  .version(false)
  .options({
    projectName: {
      type: 'string',
      description: 'Project name',
      demandOption: true,
    },
    workspaceRoot: {
      type: 'string',
      description: 'Location of test environment',
    },
    verbose: {
      type: 'boolean',
      description: 'Verbose logging',
      default: isVerbose,
    },
    targetName: {
      type: 'string',
      description: 'Verbose logging',
      default: isVerbose,
    },
    port: {
      type: 'number',
    },
  } satisfies Partial<Record<keyof StartVerdaccioAndSetupEnvOptions, Options>>)
  .parse() as StartVerdaccioAndSetupEnvOptions;

(async () => {
  const workspaceRoot = args.workspaceRoot;
  if (workspaceRoot == null) {
    throw new Error('Workspace root required.');
  }
  await setupNpmEnv({
    ...args,
    workspaceRoot,
  });
})();
