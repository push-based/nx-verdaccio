import {join} from 'node:path';
import {sortCommandHandle} from './cli';
import {afterEach, beforeEach, type MockInstance, vi} from "vitest";
import {vol} from "memfs";

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

describe('sortCommandHandle', () => {
  const MEMFS_VOLUME = '/test';
  let cwdSpy: MockInstance<[], string>;

  beforeEach(() => {
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(MEMFS_VOLUME);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
  });

  it('should sort file of users', async () => {
    const testPath = join(MEMFS_VOLUME, 'sort', 'users.json');
    vol.fromJSON({
      [testPath]: JSON.stringify([
        {name: 'Michael'},
        {name: 'Alice'},
      ]),
    }, MEMFS_VOLUME);

    await expect(sortCommandHandle({file: testPath})).resolves.not.toThrow();

    const content = vol.readFileSync(testPath).toString();
    expect(JSON.parse(content)).toEqual([
      {name: 'Alice'},
      {name: 'Michael'},
    ]);
  });
});
