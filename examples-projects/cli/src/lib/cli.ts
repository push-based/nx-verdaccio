import yargs, {Argv, Options} from 'yargs';
import { sortUserFile } from '@org/core';

export type CliArgs = {
  filePath: string;
};

const NOOP_BUILDER = <T>(_: Argv<T>) => void 0;
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
      },
    } satisfies Record<keyof CliArgs, Options>)
    .command('*', 'Sort users', NOOP_BUILDER, sortCommandHandle)
    .command('sort', 'Sort users', NOOP_BUILDER, sortCommandHandle);
}

export async function sortCommandHandle(args: CliArgs) {
  const { filePath } = args;
  await sortUserFile(filePath);
  console.log(`Sorted users in ${filePath}`);
}
