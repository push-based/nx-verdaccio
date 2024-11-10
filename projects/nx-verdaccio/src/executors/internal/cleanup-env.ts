import {rm} from "node:fs/promises";
import {join} from "node:path";

export async function cleanupEnv(environmentRoot: string) {
  // delete storage, .npmrc
  await rm(join(environmentRoot, 'storage'), {
    recursive: true,
    force: true,
    retryDelay: 100,
    maxRetries: 2,
  });
  await rm(join(environmentRoot, '.npmrc'), {
    recursive: true,
    force: true,
    retryDelay: 100,
    maxRetries: 2,
  });
}
