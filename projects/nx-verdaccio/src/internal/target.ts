import { ExecutorContext } from '@nx/devkit';
import { Target } from 'nx/src/command-line/run/run';

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
