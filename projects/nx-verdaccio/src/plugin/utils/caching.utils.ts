import { hashObject } from 'nx/src/hasher/file-hasher';

export function cacheKey(prefix: string, hashData: Record<string, unknown>) {
  return `${prefix}-${hashObject(hashData)}`;
}
