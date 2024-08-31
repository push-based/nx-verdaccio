import yargs from 'yargs';
import {sortUserFile} from "@nx-verdaccio-e2e-setup/core";

export type CliArgs = {
  file: string;
};

export function cli(args: string[]) {
  return yargs(args)
    .version(false)
    .help()
    .alias('help', 'h')
    .options({
      file: {
        type: 'string',
        description: 'The file to sort',
        demandOption: true,
      }
    })
    .usage('Usage: $0 <command> [options]')
    .command('sort', 'Sort users', sortCommandHandle);
};

export async function sortCommandHandle(args: unknown) {
  const {file} = args as CliArgs;
  await sortUserFile(file);
  console.log(`Sorted users in ${file}`);
}

