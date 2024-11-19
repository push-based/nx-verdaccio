import { expect } from 'vitest';
import path from 'path';

/**
 * Custom matcher to check if a path contains another path.
 *
 * @example
 * expect('path\\to\\file').pathToMatch('to/file');
 */
expect.extend({
  toMatchPath(received, expected) {
    const normalizedReceived = path.normalize(received);
    const normalizedExpected = path.normalize(expected);

    const pass = normalizedReceived.includes(normalizedExpected);
    if (pass) {
      return {
        message: () => `expected ${received} not to match path ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to match path ${expected}`,
        pass: false,
      };
    }
  },
  pathToMatch(received, expected) {
    const normalizedReceived = path.normalize(received);
    const normalizedExpected = path.normalize(expected);

    const pass = normalizedReceived.includes(normalizedExpected);
    if (pass) {
      return {
        message: () => `expected ${received} not to contain path ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to contain path ${expected}`,
        pass: false,
      };
    }
  },
});
