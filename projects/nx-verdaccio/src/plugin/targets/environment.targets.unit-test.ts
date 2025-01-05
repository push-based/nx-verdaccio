import { describe, expect } from 'vitest';
import { ProjectConfiguration } from '@nx/devkit';
import { isEnvProject } from './environment.targets';
import { NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';

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
