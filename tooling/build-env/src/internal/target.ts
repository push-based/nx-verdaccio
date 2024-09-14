import type { TargetConfiguration } from '@nx/devkit';

export function getTargetOutputPath(target?: TargetConfiguration) {
  const { options } = target ?? {};
  const { outputPath } = options ?? {};
  if (!outputPath) {
    throw new Error('outputPath is required');
  }
  return outputPath;
}
