import { afterEach, expect } from 'vitest';
import { executeProcess } from '@push-based/test-utils';
import { TARGET_ENVIRONMENT_SETUP } from '@push-based/nx-verdaccio';

describe('nx-verdaccio plugin nxv-env-setup target', () => {
  const projectA = 'lib-a';
  const projectAE2e = `${projectA}-e2e`;
  const baseDir = `tmp/environments/${process.env['NX_TASK_TARGET_PROJECT']}/__test__/target-env-setup`;

  afterEach(async () => {
    // await teardownTestFolder(baseDir);
  });

  it('should have caching enabled by default', async () => {
    const { stdout } = await executeProcess({
      command: 'nx',
      args: [
        'run',
        `${projectAE2e}:${TARGET_ENVIRONMENT_SETUP}`,
        '--with-deps',
        '--skip-nx-cache',
      ],
      cwd: baseDir,
    });
    expect(stdout).toContain('Environment setup completed');
  });
});
