import { type ExecutorContext, runExecutor, type Target } from '@nx/devkit';

export async function runSingleExecutor(
  target: Target,
  options: Record<string, unknown>,
  context: ExecutorContext
) {
  /* eslint-disable @typescript-eslint/no-unused-vars,no-empty */
  for await (const { success } of await runExecutor(target, options, context)) {
  }
  /* eslint-enable @typescript-eslint/no-unused-vars,no-empty */
}
