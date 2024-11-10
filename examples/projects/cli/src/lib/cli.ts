import yargs, { Argv, Options } from 'yargs';
import { sortUserFile } from '@push-based/core';

export type CliArgs = {
  filePath: string;
  plugin?: string;
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
      plugin: {
        type: 'string',
        description: 'Path to the user file',
        alias: 'p',
      },
    } satisfies Record<keyof CliArgs, Options>)
    .command('*', 'Sort users', NOOP_BUILDER, sortCommandHandle)
    .command('sort', 'Sort users', NOOP_BUILDER, sortCommandHandle);
}

export async function sortCommandHandle(args: CliArgs) {
  const { filePath, plugin } = args;
  try {
    const sortFn = plugin
      ? await import(plugin).then(({ default: d }) => d)
      : sortUserFile;
    await sortFn(filePath);
    console.log(`Sorted users in ${filePath}`);
  } catch (error) {
    console.error(`Failed to load plugin: ${plugin}`);
    throw error;
  }
}
