import { objectToCliArgs } from './terminal';

describe('objectToCliArgs', () => {
  it('should handle the "_" argument as script', () => {
    const params = { _: 'bin.js' };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['bin.js']);
  });

  it('should handle the "_" argument with multiple values', () => {
    const params = { _: ['bin.js', '--help'] };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['bin.js', '--help']);
  });

  it('should handle shorthands arguments', () => {
    const params = {
      e: `test`,
    };
    const result = objectToCliArgs(params);
    expect(result).toEqual([`-e="${params.e}"`]);
  });

  it('should handle string arguments', () => {
    const params = { name: 'Juanita' };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--name="Juanita"']);
  });

  it('should handle number arguments', () => {
    const params = { parallel: 5 };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--parallel=5']);
  });

  it('should handle boolean arguments', () => {
    const params = { progress: true };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--progress']);
  });

  it('should handle negated boolean arguments', () => {
    const params = { progress: false };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--no-progress']);
  });

  it('should handle array of string arguments', () => {
    const params = { format: ['json', 'md'] };
    const result = objectToCliArgs(params);
    expect(result).toEqual(['--format="json"', '--format="md"']);
  });

  it('should handle nested objects', () => {
    const params = { persist: { format: ['json', 'md'], verbose: false } };
    const result = objectToCliArgs(params);
    expect(result).toEqual([
      '--persist.format="json"',
      '--persist.format="md"',
      '--no-persist.verbose',
    ]);
  });

  it('should exclude undefined values', () => {
    const params = { unsupported: undefined };
    expect(objectToCliArgs(params)).toStrictEqual([]);
  });

  it('should throw error for unsupported type', () => {
    const params = { unsupported: Symbol('symbol') };
    expect(() => objectToCliArgs(params)).toThrow('Unsupported type');
  });
});
