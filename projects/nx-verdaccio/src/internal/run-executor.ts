import { type ExecutorContext, runExecutor, type Target } from '@nx/devkit';

export async function runSingleExecutor(
  target: Target,
  options: Record<string, unknown>,
  context: ExecutorContext
) {
  await (await runExecutor(target, options, context)).next();
}
