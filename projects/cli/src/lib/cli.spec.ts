import { join } from 'node:path';
import { sortUserFile } from '@org/core';
import { sortCommandHandle } from './cli';
import { vi } from 'vitest';

vi.mock('@org/core', async () => {
  const actual = await vi.importActual<typeof import('@org/core')>('@org/core');
  return {
    ...actual,
    sortUserFile: vi.fn(async () => {}),
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
