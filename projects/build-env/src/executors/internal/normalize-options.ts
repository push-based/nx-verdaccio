import type { ExecutorContext } from '@nx/devkit';

export function normalizeExecutorOptions<
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
  return {
    ...context,
    options: {
      ...options,
    },
  };
}
