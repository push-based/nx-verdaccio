import {sortUserFile} from './core';
import {vol} from 'memfs';
import {afterEach, beforeEach, type MockInstance, vi} from 'vitest';

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

const MEMFS_VOLUME = '/test';
let cwdSpy: MockInstance<[], string>;

beforeEach(() => {
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(MEMFS_VOLUME);
});

afterEach(() => {
  cwdSpy.mockRestore();
});


describe('sortUserFile', () => {
  beforeEach(() => {

  })
  it('should sort json file of users', async () => {
    vol.fromJSON({
      '/test/users.json': JSON.stringify([
        { name: 'Michael' },
        { name: 'Alice' },
      ]),
    });
    await sortUserFile('users.json');
    const usersFromFile = vol.readFileSync('/test/users.json', 'utf8').toString();
    expect(JSON.parse(usersFromFile)).toEqual([
      { name: 'Alice' },
      { name: 'Michael' },
    ]);
  });
});
