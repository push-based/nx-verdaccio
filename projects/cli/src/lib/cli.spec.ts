import { join } from 'node:path';
import { sortUserFile } from '@push-based/core';
import { sortCommandHandle } from './cli';
import { vi } from 'vitest';

vi.mock('@push-based/core', async () => {
  const actual = await vi.importActual<typeof import('@push-based/core')>('@push-based/core');
  return {
    ...actual,
    sortUserFile: vi.fn(async () => void 0),
  };
});

describe('sortCommandHandle', () => {
  it('should sort file of users', async () => {
    const testPath = join('sort', 'users.json');
    await expect(
      sortCommandHandle({ filePath: testPath })
    ).resolves.not.toThrow();

    expect(sortUserFile).toHaveBeenCalledWith(testPath);
  });
});
