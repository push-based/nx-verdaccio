import yargs, {Options} from 'yargs';
import {sortUserFile} from "@org/core";

export type CliArgs = {
  filePath: string;
};

export function cli(args: string[]) {
  return yargs(args)
    .version(false)
    .help(true)
    .alias('help', 'h')
    .options({
      filePath: {
        type: 'string',
        description: 'Path to the user file',
        demandOption: true,
      }
    } satisfies Record<keyof CliArgs, Options>)
    //.command('*', 'Sort users', sortCommandHandle)
    .command('sort', 'Sort users', sortCommandHandle);
};

export async function sortCommandHandle(args: any) {
  const {filePath} = args as CliArgs;
  await sortUserFile(filePath);
  console.log(`Sorted users in ${filePath}`);
}

