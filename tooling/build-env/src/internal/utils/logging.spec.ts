import { describe, expect, it } from 'vitest';
import { bold, gray, red } from 'ansis';
import { formatError, formatInfo } from './logging';

describe('formatInfo', () => {
  it('should format info message correctly', () => {
    expect(formatInfo('message', 'token')).toBe(
      `${gray('>')} ${gray(bold('token'))} ${'message'}`
    );
  });
});

describe('formatError', () => {
  it('should format error message correctly', () => {
    expect(formatError('message', 'token')).toBe(
      `${red('>')} ${red(bold('token'))} ${'message'}`
    );
  });
});
