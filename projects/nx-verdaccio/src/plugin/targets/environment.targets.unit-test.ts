import { afterEach, describe, expect } from 'vitest';
import { ProjectConfiguration } from '@nx/devkit';
import { isEnvProject, verdaccioTargets } from './environment.targets';
import { NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';
import { PACKAGE_NAME } from '../constants';
import { EXECUTOR_ENVIRONMENT_KILL_PROCESS } from '../../executors/kill-process/constant';

import * as nodePathModule from 'node:path';
import { VERDACCIO_REGISTRY_JSON } from '../../executors/env-bootstrap/constants';
import { uniquePort } from '../../executors/env-bootstrap/unique-port';

export const TARGET_ENVIRONMENT_VERDACCIO_START = 'nxv-verdaccio-start';
export const TARGET_ENVIRONMENT_VERDACCIO_STOP = 'nxv-verdaccio-stop';

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
    const mockProjectConfig = { name: 'test-project', root: 'test' };
    const mockOptions = {
      environmentsDir: 'environments',
      customOption: 'custom-value',
    };
    const VERDACCIO_STORAGE_DIR = 'storage';
    const result = verdaccioTargets(mockProjectConfig, mockOptions);

    expect(result).toEqual({
      [TARGET_ENVIRONMENT_VERDACCIO_START]: {
        outputs: [`{options.environmentRoot}/${VERDACCIO_STORAGE_DIR}`],
        executor: '@nx/js:verdaccio',
        options: {
          config: '.verdaccio/config.yml',
          port: 1337,
          storage: `mocked-join`,
          clear: true,
          environmentDir: `mocked-join`,
          projectName: 'test-project',
          customOption: 'custom-value',
        },
      },
      [TARGET_ENVIRONMENT_VERDACCIO_STOP]: {
        executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_KILL_PROCESS}`,
        options: {
          filePath: 'mocked-join',
          customOption: 'custom-value',
        },
      },
    });
  });

  it('should call join 3 times with correct arguments', (): void => {
    const projectConfig = { name: 'test-project', root: '' };
    const options = {
      environmentsDir: 'environments',
      customOption: 'custom-value',
    };

    verdaccioTargets(projectConfig, options);

    expect(nodePathModule.join).toHaveBeenCalledTimes(3);
    expect(nodePathModule.join).toHaveBeenNthCalledWith(1, 'environments', 'test-project');
    expect(nodePathModule.join).toHaveBeenNthCalledWith(2, 'mocked-join', 'storage');
    expect(nodePathModule.join).toHaveBeenNthCalledWith(3, 'environments', VERDACCIO_REGISTRY_JSON);
  });

  it('should call uniquePort once', (): void => {
    const projectConfig = { name: 'test-project', root: '' };
    const options = {
      environmentsDir: 'environments',
      customOption: 'custom-value',
    };

    verdaccioTargets(projectConfig, options);
    expect(uniquePort).toHaveBeenCalledTimes(1);
  });
});
