import { logger, readJsonFile } from '@nx/devkit';
import { rm } from 'node:fs/promises';

export async function killProcessFromFilePath(
  filePath: string,
  options?: {
    cleanFs?: boolean;
    dryRun?: boolean;
    verbose?: boolean;
  }
): Promise<void> {
  const { cleanFs = true, dryRun = false, verbose = false } = options ?? {};
  let pid: string | number | undefined;
  try {
    const json = readJsonFile<{ pid?: string | number }>(filePath);
    pid = json.pid;
  } catch (error) {
    throw new Error(`Could not load ${filePath} to get pid`);
  }

  if (pid === undefined) {
    throw new Error(`no pid found in file ${filePath}`);
  }

  try {
    if (dryRun) {
      if (verbose) {
        logger.warn(
          `Would kill process with id: ${pid}. But dryRun is enabled.`
        );
      }
    } else {
      process.kill(Number(pid));
      logger.info(`Killed process with id: ${pid}.`);
    }
  } catch (e) {
    logger.error(`Failed killing process with id: ${pid}\n${e}`);
  } finally {
    if (cleanFs) {
      await rm(filePath);
    }
  }
}
