import { ExecutorContext, readTargetOptions, Target } from '@nx/devkit';

export function getTargetOutputPath(
  targetOptions: Target & { optionsKey: string },
  context: ExecutorContext
) {
  const { optionsKey, ...target } = targetOptions;
  const { options } = readTargetOptions(target, context);
  const outputPath = (options ?? {})[optionsKey];
  if (!(optionsKey in (options ?? {})) || !outputPath) {
    throw new Error(
      `The target: ${target.target} in project: ${context.projectName} has no option: ${optionsKey} configured.`
    );
  }
  return outputPath;
}
