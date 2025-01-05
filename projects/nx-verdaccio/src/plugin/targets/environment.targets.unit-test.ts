import { describe, expect } from 'vitest';
import { ProjectConfiguration } from '@nx/devkit';
import { isEnvProject, verdaccioTargets } from './environment.targets';
import { NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';
import { join } from 'path';
import { PACKAGE_NAME } from '../constants';
import { EXECUTOR_ENVIRONMENT_KILL_PROCESS } from '../../executors/kill-process/constant';

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
  vi.mock('path', () => ({
    join: vi.fn((...args) => args.join('/')),
  }));
  vi.mock('./utils', () => ({
    uniquePort: vi.fn(() => 4873), // Mocking a fixed port
  }));

  it('should generate correct Verdaccio start and stop targets', () => {
    const mockProjectConfig = { name: 'test-project', root: 'test' };
    const mockOptions = {
      environmentsDir: 'environments',
      customOption: 'custom-value',
    };
    const VERDACCIO_STORAGE_DIR = 'storage';
    const result = verdaccioTargets(mockProjectConfig, mockOptions);

    // Expected environment directory
    const expectedEnvironmentDir = 'environments/test-project';

    expect(result).toEqual({
      TARGET_ENVIRONMENT_VERDACCIO_START: {
        outputs: [`${expectedEnvironmentDir}/${VERDACCIO_STORAGE_DIR}`],
        executor: '@nx/js:verdaccio',
        options: {
          config: '.verdaccio/config.yml',
          port: 4873,
          storage: `${expectedEnvironmentDir}/${VERDACCIO_STORAGE_DIR}`,
          clear: true,
          environmentDir: expectedEnvironmentDir,
          projectName: 'test-project',
          customOption: 'custom-value',
        },
      },
      TARGET_ENVIRONMENT_VERDACCIO_STOP: {
        executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_KILL_PROCESS}`,
        options: {
          filePath: 'environments/registry.json',
          customOption: 'custom-value',
        },
      },
    });

    // Ensure mocked functions are called correctly
    expect(join).toHaveBeenCalledWith('environments', 'test-project');
  });
});
