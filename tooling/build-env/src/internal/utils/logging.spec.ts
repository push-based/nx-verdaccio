import { beforeEach, describe, expect, it, vi } from 'vitest';
import { error, info } from './logging';
import { bold, gray, red } from 'ansis';

describe('info', () => {
  let consoleInfoSpy;
  let consoleErrorSpy;
  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(vi.fn());
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
  });

  it('should log info', () => {
    info('message', 'token');
    expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      `${gray('>')} ${gray(bold('token'))} ${'message'}`
    );
  });

  it('should log error', () => {
    error('message', 'token');
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `${red('>')} ${red(bold('token'))} ${'message'}`
    );
  });
});
