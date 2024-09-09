import { describe, it, expect } from 'vitest';
import { getEnvironmentsRoot } from '@org/build-env';

describe('getEnvironmentsRoot', () => {
  it('should return default env dir', () => {
    expect(getEnvironmentsRoot()).toBe('tmp/environments');
  });

  it('should return given path', () => {
    expect(getEnvironmentsRoot('env')).toBe('env');
  });
});
