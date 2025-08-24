import { expect } from 'vitest';
import path from 'path';
// eslint-disable @typescript-eslint/no-explicit-any
declare module 'vitest' {
  interface Assertion<T = any> {
    toMatchPath(expected: string): T;
    pathToMatch(expected: string): T;
  }

  interface AsymmetricMatchersContaining {
    toMatchPath(expected: string): any;
    pathToMatch(expected: string): any;
  }
}
// eslint-enable @typescript-eslint/no-explicit-any

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
