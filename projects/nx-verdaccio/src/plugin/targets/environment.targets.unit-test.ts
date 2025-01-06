import {
  afterEach,
  beforeEach,
  describe,
  expect,
  Mock,
  MockInstance,
} from 'vitest';
import { ProjectConfiguration, TargetConfiguration } from '@nx/devkit';
import {
  TARGET_ENVIRONMENT_VERDACCIO_START,
  TARGET_ENVIRONMENT_VERDACCIO_STOP,
  VERDACCIO_STORAGE_DIR,
  isEnvProject,
  verdaccioTargets,
} from './environment.targets';
import { NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';
import { PACKAGE_NAME } from '../constants';
import { EXECUTOR_ENVIRONMENT_KILL_PROCESS } from '../../executors/kill-process/constant';
import { VERDACCIO_REGISTRY_JSON } from '../../executors/env-bootstrap/constants';

import * as nodePathModule from 'node:path';
import * as uniquePortModule from '../../executors/env-bootstrap/unique-port';

describe('isEnvProject', () => {
  const projectConfig: ProjectConfiguration = {
    root: '',
    tags: ['env:production', 'type:library'],
    targets: {
      build: {},
      test: {},
    },
  };
  const normalizedOptions: NormalizedCreateNodeOptions['environments'] = {
    environmentsDir: '',
    targetNames: ['cola', 'mock', 'build'],
    filterByTags: ['env:production'],
  };

  it('should returns false if targets missing', () => {
    const config = { ...projectConfig, targets: null };
    const result = isEnvProject(config, normalizedOptions);
    expect(result).toBe(false);
  });

  it('should returns false if targetNames missing', () => {
    const options = { ...normalizedOptions, targetNames: null };
    const result = isEnvProject(projectConfig, options);
    expect(result).toBe(false);
  });

  it('should returns false if targetNames and targets missing', () => {
    const config = { ...projectConfig, targets: null };
    const result = isEnvProject(config, normalizedOptions);
    expect(result).toBe(false);
  });

  it('should returns false if targetNames don’t match environmentTargetNames', () => {
    const options = { ...normalizedOptions, targetNames: ['mockTarget'] };
    const result = isEnvProject(projectConfig, options);
    expect(result).toBe(false);
  });

  it('should returns true if targetNames match and no tags', () => {
    const config = { ...projectConfig, tags: null };
    const result = isEnvProject(config, normalizedOptions);
    expect(result).toBe(true);
  });

  it('should returns true if targetNames match and no filterByTags', () => {
    const options = {
      ...normalizedOptions,
      filterByTags: null,
    };
    const result = isEnvProject(projectConfig, options);
    expect(result).toBe(true);
  });

  it('should returns true if targetNames match and tags match filterByTags', () => {
    const result = isEnvProject(projectConfig, normalizedOptions);
    expect(result).toBe(true);
  });

  it('should returns false if targetNames match but tags don’t match filterByTags', () => {
    const options = {
      ...normalizedOptions,
      filterByTags: ['mock-tag-no-match'],
    };
    const result = isEnvProject(projectConfig, options);
    expect(result).toBe(false);
  });
});

describe('verdaccioTargets', () => {
  const port = 1337;
  const environmentsDir = 'environments';
  const projectName = 'test-project';
  const joinResult = 'mocked-join';
  const customOption = 'custom-value';
  const projectConfig = { name: projectName, root: 'test' };
  const options = {
    environmentsDir,
    customOption,
  };

  let uniquePortSpy: MockInstance<[], number>;

  vi.mock('node:path', (): { join: Mock } => {
    return {
      join: vi.fn().mockReturnValue('mocked-join'),
    };
  });

  beforeEach((): void => {
    uniquePortSpy = vi
      .spyOn(uniquePortModule, 'uniquePort')
      .mockReturnValue(port);
  });
  afterEach((): void => {
    vi.clearAllMocks();
    uniquePortSpy.mockRestore();
  });

  it('should generate object with correct start&end targets', (): void => {
    const result: Record<string, TargetConfiguration> = verdaccioTargets(
      projectConfig,
      options
    );

    expect(result).toEqual({
      [TARGET_ENVIRONMENT_VERDACCIO_START]: {
        outputs: [`{options.environmentRoot}/${VERDACCIO_STORAGE_DIR}`],
        executor: '@nx/js:verdaccio',
        options: {
          config: '.verdaccio/config.yml',
          port: port,
          storage: joinResult,
          clear: true,
          environmentDir: joinResult,
          projectName: projectName,
          customOption: customOption,
        },
      },
      [TARGET_ENVIRONMENT_VERDACCIO_STOP]: {
        executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_KILL_PROCESS}`,
        options: {
          filePath: joinResult,
          customOption: customOption,
        },
      },
    });
  });

  it('should call join 3 times with correct arguments', (): void => {
    verdaccioTargets(projectConfig, options);

    expect(nodePathModule.join).toHaveBeenCalledTimes(3);
    expect(nodePathModule.join).toHaveBeenNthCalledWith(
      1,
      environmentsDir,
      projectName
    );
    expect(nodePathModule.join).toHaveBeenNthCalledWith(
      2,
      joinResult,
      VERDACCIO_STORAGE_DIR
    );
    expect(nodePathModule.join).toHaveBeenNthCalledWith(
      3,
      environmentsDir,
      VERDACCIO_REGISTRY_JSON
    );
  });

  it('should call uniquePort once', (): void => {
    verdaccioTargets(projectConfig, options);

    expect(uniquePortSpy).toHaveBeenCalledTimes(1);
  });
});
