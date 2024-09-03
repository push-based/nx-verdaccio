import {
  setupNpmEnv,
  StartVerdaccioAndSetupEnvOptions,
} from '../lib/verdaccio/verdaccio-npm-env';
import yargs, { Options } from 'yargs';

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
  } satisfies Partial<Record<keyof StartVerdaccioAndSetupEnvOptions, Options>>)
  .parse() as StartVerdaccioAndSetupEnvOptions;

(async () => {
  await setupNpmEnv(args);
})();
