import { ExecutorContext, Target } from '@nx/devkit';
import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

export function getTargetOutputPath(
  task: Target,
  context: ExecutorContext
): string {
  const { project, target } = task;

  const projectConfig = context.projectsConfigurations?.projects?.[project];
  if (!projectConfig) {
    throw new Error(`Project ${project} not found in context`);
  }

  const targetConfig = projectConfig.targets?.[target];
  if (!targetConfig) {
    throw new Error(`Target ${target} not found for project ${project}`);
  }

  const { outputPath } = targetConfig.options ?? {};
  if (!outputPath) {
    throw new Error(
      `outputPath is required in target ${target} for project ${project}`
    );
  }
  return outputPath;
}

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
