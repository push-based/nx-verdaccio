import { mkdir } from 'node:fs/promises';
import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

export function getBuildOutputPathFromBuildTarget(
  projectConfiguration: ProjectConfiguration
) {
  const { targets } = projectConfiguration;
  const { build } = targets ?? {};
  const { options } = build ?? {};
  const { outputPath } = options ?? {};
  if (outputPath == null) {
    throw new Error('outputPath is required');
  }
  return outputPath;
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
