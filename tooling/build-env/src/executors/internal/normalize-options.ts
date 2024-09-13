import { join } from 'node:path';
import { DEFAULT_ENVIRONMENTS_OUTPUT_DIR } from '../../internal/constants';
import type { ExecutorContext } from '@nx/devkit';

export function normalizeOptions<
  T extends ExecutorContext,
  I extends Record<string, unknown> & {
    environmentProject?: string;
    environmentRoot?: string;
  }
>(
  context: T,
  options: I
): T & {
  options: I & { environmentRoot: string };
} {
  const { projectName } = context;
  const { environmentProject = projectName, environmentRoot } = options;
  return {
    ...context,
    options: {
      ...options,
      environmentProject,
      environmentRoot:
        environmentRoot ??
        join(DEFAULT_ENVIRONMENTS_OUTPUT_DIR, environmentProject),
    },
  };
}
