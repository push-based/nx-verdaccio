import { getTargetOutputPath } from './target';

describe('getTargetOutputPath', () => {
  it('should return output path of the build target if given', () => {
    expect(
      getTargetOutputPath({
        options: {
          outputPath: 'out-dir',
        },
      })
    ).toBe('out-dir');
  });

  it('should throw if no outputPath is given in options', () => {
    expect(() =>
      getTargetOutputPath({
        options: {},
      })
    ).toThrow('outputPath is required');
  });

  it('should throw if empty object is passed', () => {
    expect(() => getTargetOutputPath({})).toThrow('outputPath is required');
  });
});
