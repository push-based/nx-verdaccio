import yargs, { Options } from 'yargs';
import {
  setupNpmEnv,
  StartVerdaccioAndSetupEnvOptions,
} from '@org/tools-utils';

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
      default: false,
    },
    targetName: {
      type: 'string',
      description: "Target name for Verdaccio's configuration",
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
