import { describe, it, expect } from 'vitest';
import { parseRegistryData } from './verdaccio-registry'; // Adjust import path

describe('parseRegistryData', () => {
  it('should correctly parse protocol host and port from stdout', () => {
    const stdout =
      'warn --- http address - http://localhost:4873/ - verdaccio/5.31.1';
    const result = parseRegistryData(stdout);

    expect(result).toEqual({
      protocol: 'http',
      host: 'localhost',
      port: 4873,
      url: 'http://localhost:4873',
    });
  });

  it('should correctly parse https protocol', () => {
    const stdout =
      'warn --- http address - https://localhost:4873/ - verdaccio/5.31.1';
    const result = parseRegistryData(stdout);

    expect(result.protocol).toEqual('https');
  });

  it('should throw an error if the protocol is invalid', () => {
    const stdout = 'ftp://localhost:4873'; // Invalid protocol
    expect(() => parseRegistryData(stdout)).toThrowError(
      'Could not parse registry data from stdout'
    );
  });

  it('should throw an error if the host is missing', () => {
    const stdout = 'http://:4873'; // Missing host
    expect(() => parseRegistryData(stdout)).toThrowError(
      'Could not parse registry data from stdout'
    );
  });

  it('should throw an error if the stdout is empty', () => {
    const stdout = ''; // Empty output
    expect(() => parseRegistryData(stdout)).toThrowError(
      'Could not parse registry data from stdout'
    );
  });

  it('should throw an error if the port is missing', () => {
    const stdout = 'http://localhost:'; // Missing port
    expect(() => parseRegistryData(stdout)).toThrowError(
      'Could not parse registry data from stdout'
    );
  });
});
