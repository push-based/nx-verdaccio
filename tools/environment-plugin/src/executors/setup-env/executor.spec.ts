import { ExecutorContext } from '@nx/devkit';

import { SetupEnvExecutorSchema } from './schema';
import executor from './executor';

const options: SetupEnvExecutorSchema = {};
const context: ExecutorContext = {
  root: '',
  cwd: process.cwd(),
  isVerbose: false,
};

describe('SetupEnv Executor', () => {
  it('can run', async () => {
    const output = await executor(options, context);
    expect(output.success).toBe(true);
  });
});
