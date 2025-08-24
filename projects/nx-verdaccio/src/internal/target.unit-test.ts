import { getTargetOutputPath } from './target';
import { beforeEach } from 'vitest';
import { type ProjectGraph } from 'nx/src/config/project-graph';
import { type ExecutorContext } from '@nx/devkit';

describe('getTargetOutputPath', () => {
  const executorContext: ExecutorContext = {
    root: '',
    nxJsonConfiguration: {},
    cwd: '',
    isVerbose: false,
    projectGraph: {} as ProjectGraph,
    projectsConfigurations: {
      version: 2,
      projects: {
        'my-lib': {
          root: 'libs/my-lib',
          sourceRoot: 'libs/my-lib/src',
          projectType: 'library',
          targets: {
            build: {
              executor: '@nx/vite:build',
              options: {
                outputPath: 'build-out-dir',
              },
            },
            release: {
              executor: '@nx/vite:build',
              options: {
                outputPath: 'release-out-dir',
              },
            },
          },
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return output path of the build target if given', () => {
    expect(
      getTargetOutputPath(
        {
          project: 'my-lib',
          target: 'build',
        },
        executorContext
      )
    ).toBe('build-out-dir');
  });

  it('should throw if no outputPath is given in options', () => {
    expect(() =>
      getTargetOutputPath(
        {
          project: 'my-lib',
          target: 'build',
        },
        {
          ...executorContext,
          projectsConfigurations: {
            ...executorContext.projectsConfigurations,
            projects: {
              ...executorContext.projectsConfigurations.projects,
              'my-lib': {
                ...executorContext.projectsConfigurations.projects['my-lib'],
                targets: {
                  ...executorContext.projectsConfigurations.projects['my-lib']
                    .targets,
                  build: {
                    ...executorContext.projectsConfigurations.projects['my-lib']
                      .targets['build'],
                    options: {},
                  },
                },
              },
            },
          },
        }
      )
    ).toThrow('outputPath is required');
  });
});
