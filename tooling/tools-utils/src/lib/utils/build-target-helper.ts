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
