import { join } from 'node:path';
import { DEFAULT_ENVIRONMENTS_OUTPUT_DIR } from '../../internal/constants';
import type { ExecutorContext } from '@nx/devkit';

export function normalizeOptions<
  T extends ExecutorContext,
  I extends Record<string, unknown> & { environmentProject?: string }
>(
  context: T,
  options: I
): T & {
  options: I & { environmentRoot: string };
} {
  const { projectName } = context;
  const { environmentProject = projectName } = options;
  return {
    ...context,
    options: {
      ...options,
      // @TODO reconsider if this should stay here
      environmentProject,
      environmentRoot: join(
        DEFAULT_ENVIRONMENTS_OUTPUT_DIR,
        environmentProject
      ),
    },
  };
}
