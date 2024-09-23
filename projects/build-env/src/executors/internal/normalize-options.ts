import type { ExecutorContext } from '@nx/devkit';

export function normalizeExecutorOptions<
  T extends ExecutorContext,
  I extends Record<string, unknown>
>(
  context: T,
  options: I
): T & {
  options: I;
} {
  return {
    ...context,
    options: {
      ...options,
    },
  };
}
