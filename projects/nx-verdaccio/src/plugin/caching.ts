import {
  type ProjectConfiguration,
  readJsonFile,
  writeJsonFile,
} from '@nx/devkit';
import { existsSync } from 'node:fs';
import { cacheKey } from './utils/caching.utils';

export function getCacheRecord<T>(
  targetsCache: Record<string, T>,
  prefix: string,
  hashData: Record<string, unknown>
): T {
  const targetCacheKey = cacheKey(prefix, hashData);

  if (targetsCache[targetCacheKey]) {
    return targetsCache[targetCacheKey];
  }
  return undefined;
}

export function setCacheRecord<T>(
  targetsCache: Record<string, T>,
  prefix: string,
  hashData: Record<string, unknown>,
  cacheData: T
): T {
  const targetCacheKey = cacheKey(prefix, hashData);

  return (targetsCache[targetCacheKey] = cacheData);
}

export function readTargetsCache(
  cachePath: string
): Record<string, Partial<ProjectConfiguration>> {
  return process.env.NX_CACHE_PROJECT_GRAPH !== 'false' && existsSync(cachePath)
    ? readJsonFile(cachePath)
    : {};
}

export function writeTargetsToCache(
  cachePath: string,
  results: Record<string, Partial<ProjectConfiguration>>
) {
  process.env.NX_CACHE_PROJECT_GRAPH !== 'false' &&
    writeJsonFile(cachePath, results);
}
