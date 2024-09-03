import {logger, readJsonFile} from "@nx/devkit";
import {rm} from "node:fs/promises";

export async function killProcessFromPid(filePath: string, cleanFs = true): Promise<void> {
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
    process.kill(Number(pid));
  } catch (e) {
    logger.error(`Failed killing process with id: ${pid}\n${e}`);
  } finally {
    if(cleanFs) {
      await rm(filePath);
    }
  }

}
