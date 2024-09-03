import { mkdir } from 'node:fs/promises';

export function uniquePort(): number {
  return Number((6000 + Number(Math.random() * 1000)).toFixed(0));
}

export async function ensureDirectoryExists(baseDir: string) {
  try {
    await mkdir(baseDir, { recursive: true });
    return;
  } catch (error) {
    console.error((error as { code: string; message: string }).message);
    if ((error as { code: string }).code !== 'EEXIST') {
      throw error;
    }
  }
}
