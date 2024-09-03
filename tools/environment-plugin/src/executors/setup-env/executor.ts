import { Executor } from '@nx/devkit';
import { SetupEnvExecutorSchema } from './schema';
import { setupNpmEnv } from '@org/tools-utils';
import { join } from 'node:path';

const runExecutor: Executor<SetupEnvExecutorSchema> = async (options) => {
  const workspaceRoot = join('tmp', 'npm-env', 'projectName');
  const result = await setupNpmEnv({
    ...options,
    workspaceRoot,
  });

  return {
    success: true,
    result,
  };
};

export default runExecutor;
