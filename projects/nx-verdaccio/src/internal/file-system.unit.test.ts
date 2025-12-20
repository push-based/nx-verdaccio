import { join } from 'node:path';
import { stat } from 'node:fs/promises';
import { MEMFS_VOLUME } from '@push-based/test-utils';
import { vol } from 'memfs';
import { ensureDirectoryExists } from './file-system';

describe('ensureDirectoryExists', () => {
  it('should create a nested folder', async () => {
    vol.fromJSON({}, MEMFS_VOLUME);

    const dir = join('sub', 'dir');

    await ensureDirectoryExists(dir);
    await expect(
      stat(dir).then((stats) => stats.isDirectory())
    ).resolves.toBeTruthy();
  });
});
