import { getTargetOutputPath } from './target';
import { type ExecutorContext } from '@nx/devkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as devkit from '@nx/devkit';

describe('getTargetOutputPath', () => {
  const mockContext: ExecutorContext = {
    projectName: 'my-lib',
    targetName: 'build',
    root: '.',
    cwd: process.cwd(),
    isVerbose: false,
    projectsConfigurations: {
      version: 1,
      projects: {},
    },
  } as ExecutorContext;

  const readTargetOptionsSpy = vi.spyOn(devkit, 'readTargetOptions');

  beforeEach(() => {
    readTargetOptionsSpy.mockReset();
  });

  it('should return output path of the build target if given', () => {
    const projectName = 'my-lib';
    const expectedOutputPath = `${projectName}/dist`;

    readTargetOptionsSpy.mockReturnValue({
      outputPath: expectedOutputPath,
      main: `${projectName}/src/index.ts`,
      tsConfig: `${projectName}/tsconfig.json`,
    });

    expect(
      getTargetOutputPath(
        {
          project: projectName,
          target: 'build',
          optionsKey: 'outputPath',
        },
        mockContext
      )
    ).toBe(expectedOutputPath);
  });

  it('should throw if no outputPath is given in options', () => {
    const projectName = 'my-lib';

    readTargetOptionsSpy.mockReturnValue({
      main: `${projectName}/src/index.ts`,
      tsConfig: `${projectName}/tsconfig.json`,
    });

    expect(() =>
      getTargetOutputPath(
        {
          project: projectName,
          target: 'build',
          optionsKey: 'outputPath',
        },
        mockContext
      )
    ).toThrow(
      `The target: build in project: ${projectName} has no option: outputPath configured`
    );
  });

  it('should throw if empty object is passed', () => {
    readTargetOptionsSpy.mockReturnValue({});

    expect(() => getTargetOutputPath({} as never, mockContext)).toThrow(
      `The target: undefined in project: my-lib has no option: undefined configured`
    );
  });

  it('should call readTargetOptions with correct arguments', () => {
    const projectName = 'my-lib';
    const targetOptions = {
      project: projectName,
      target: 'build',
      optionsKey: 'outputPath',
    };

    readTargetOptionsSpy.mockReturnValue({
      outputPath: `${projectName}/dist`,
    });

    getTargetOutputPath(targetOptions, mockContext);

    expect(readTargetOptionsSpy).toHaveBeenCalledWith(
      {
        project: projectName,
        target: 'build',
      },
      mockContext
    );
    expect(readTargetOptionsSpy).toHaveBeenCalledTimes(1);
  });
});
