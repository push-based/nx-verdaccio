import { mkdir } from 'node:fs/promises';
import type { TargetConfiguration } from '@nx/devkit';

export function getBuildOutput(target?: TargetConfiguration) {
  const { options } = target ?? {};
  const { outputPath } = options ?? {};
  if (!outputPath) {
    throw new Error('outputPath is required');
  }
  return outputPath;
}

export function uniquePort(): number {
  return Number((6000 + Number(Math.random() * 1000)).toFixed(0));
}
