import { join } from 'node:path';
import plugin1 from './plugin';
import { vol } from 'memfs';
import { MEMFS_VOLUME } from '@push-based/test-utils';

describe('plugin', () => {
  it('should sort file of users', async () => {
    const testPath = join('sort', 'users.json');
    vol.fromJSON(
      {
        [testPath]: JSON.stringify([
          { name: 'B' },
          { name: 'A' },
          { name: 'C' },
        ]),
      },
      MEMFS_VOLUME
    );

    await expect(plugin1(testPath)).resolves.not.toThrow();

    const content = JSON.parse(await vol.promises.readFile(testPath));
    expect(content).toStrictEqual([
      { name: 'C' },
      { name: 'B' },
      { name: 'A' },
    ]);
  });
});
