import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';

export async function ensureDirectoryExists(baseDir: string) {
  try {
    await mkdir(baseDir, {recursive: true});
    return;
  } catch (error) {
    console.error((error as { code: string; message: string }).message);
    if ((error as { code: string }).code !== 'EEXIST') {
      throw error;
    }
  }
}

export async function updateJson<T = Record<string, unknown>>(
  target: string,
  transformFn: <O extends T>(i: T) => O
): Promise<void> {
  let json = {};
  try {
    await mkdir(dirname(target), {recursive: true});
  } catch (e) {
  }
  try {
    json = JSON.parse((await readFile(target)).toString());
  } catch (e) {
  }
  await writeFile(target, JSON.stringify(transformFn(json), null, 2));
}
