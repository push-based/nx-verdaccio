import { join } from 'node:path';
import { DEFAULT_ENVIRONMENTS_OUTPUT_DIR } from '../../internal/constants';
import { ExecutorContext } from '@nx/devkit';

export function normalizeOptions<
  T extends ExecutorContext,
  I extends Record<string, unknown>
>(
  context: T,
  options: I
): T & {
  options: I & { environmentRoot: string };
} {
  const { projectName } = context;
  return {
    ...context,
    options: {
      ...options,
      environmentRoot: join(DEFAULT_ENVIRONMENTS_OUTPUT_DIR, projectName),
    },
  };
}
