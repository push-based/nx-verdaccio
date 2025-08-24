import { ExecutorContext, readTargetOptions, Target } from '@nx/devkit';

export function getTargetOutputPath(
  targetOptions: Target & { optionsKey: string },
  context: ExecutorContext
) {
  const { optionsKey, ...target } = targetOptions;
  const { options } = readTargetOptions(target, context);
  const { [optionsKey]: outputPath } = options ?? {};
  if (!outputPath) {
    throw new Error(
      `The tagtet ${target.target} in project ${context.projectName} has no option ${optionsKey} configured.`
    );
  }
  return outputPath;
}
