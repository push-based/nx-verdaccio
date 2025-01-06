import { afterEach, describe, expect } from 'vitest';
import { ProjectConfiguration } from '@nx/devkit';
import {
  TARGET_ENVIRONMENT_VERDACCIO_START,
  TARGET_ENVIRONMENT_VERDACCIO_STOP,
  VERDACCIO_STORAGE_DIR,
  isEnvProject,
  verdaccioTargets
} from './environment.targets';
import { NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';
import { PACKAGE_NAME } from '../constants';
import { EXECUTOR_ENVIRONMENT_KILL_PROCESS } from '../../executors/kill-process/constant';
import { VERDACCIO_REGISTRY_JSON } from '../../executors/env-bootstrap/constants';
import { uniquePort } from '../../executors/env-bootstrap/unique-port';

import * as nodePathModule from 'node:path';

describe('isEnvProject', () => {
const projectConfig: ProjectConfiguration = {
  root: '',
  tags: ['env:production', 'type:library'],
  targets: {
    build: {},
    test: {},
  }
};
const normalizedOptions: NormalizedCreateNodeOptions['environments'] = {
  environmentsDir: '',
  targetNames: ['cola', 'mock', 'build'],
  filterByTags: ['env:production']
};

it('should returns false if targets missing', () => {
  const config = { ...projectConfig, targets: null };
  const result = isEnvProject(config, normalizedOptions);
  expect(result).toBe(false);
});

it('should returns false if targetNames missing', () => {
  const options = {...normalizedOptions, targetNames: null}
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
    filterByTags: null
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
    filterByTags: ['mock-tag-no-match']
  };
  const result = isEnvProject(projectConfig, options);
  expect(result).toBe(false);
});
});

describe('verdaccioTargets', () => {
  const environmentsDir = 'environments'
  const projectName = 'test-project';
  const mockProjectConfig = { name: projectName, root: 'test' };
  const customOption = 'custom-value';
  const mockOptions = {
    environmentsDir,
    customOption,
  };
  const joinResult = 'mocked-join'

  vi.mock('node:path', async () => {
    const actualPath = await vi.importActual('node:path');
    return {
      ...actualPath,
      join: vi.fn().mockReturnValue('mocked-join'),
    };
  });

  vi.mock( '../../executors/env-bootstrap/unique-port', () => ({
    uniquePort: vi.fn().mockReturnValue(1337),
  }));

  afterEach((): void => {
    vi.clearAllMocks();
  });

  it('should generate object with correct start&end targets', (): void => {
    const result = verdaccioTargets(mockProjectConfig, mockOptions);

    expect(result).toEqual({
      [TARGET_ENVIRONMENT_VERDACCIO_START]: {
        outputs: [`{options.environmentRoot}/${VERDACCIO_STORAGE_DIR}`],
        executor: '@nx/js:verdaccio',
        options: {
          config: '.verdaccio/config.yml',
          port: 1337,
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
    verdaccioTargets(mockProjectConfig, mockOptions);

    expect(nodePathModule.join).toHaveBeenCalledTimes(3);
    expect(nodePathModule.join).toHaveBeenNthCalledWith(1, environmentsDir, projectName);
    expect(nodePathModule.join).toHaveBeenNthCalledWith(2, joinResult, VERDACCIO_STORAGE_DIR);
    expect(nodePathModule.join).toHaveBeenNthCalledWith(3, environmentsDir, VERDACCIO_REGISTRY_JSON);
  });

  it('should call uniquePort once', (): void => {
    verdaccioTargets(mockProjectConfig, mockOptions);

    expect(uniquePort).toHaveBeenCalledTimes(1);
  });
});
