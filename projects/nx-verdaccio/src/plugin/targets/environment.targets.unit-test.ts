import { describe, expect } from 'vitest';
import { ProjectConfiguration } from '@nx/devkit';
import { isEnvProject } from './environment.targets';
import { NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';

describe('isEnvProject', () => {
  const projectConfig: ProjectConfiguration = {
    root: '',
    tags: ['env:production', 'type:library'],
    targets: {}
  };
  const normalizedCreateNodeOptions: NormalizedCreateNodeOptions['environments'] = {
    environmentsDir: '',
    targetNames: null,
    filterByTags: ['env:production']
  };

  it('should return false if existingTargetNames are not present', () => {
    const options = {...normalizedCreateNodeOptions, targetNames: ['mockTarget']}
    const config = {...projectConfig, targets: null}
    const result = isEnvProject(config, options);
    expect(result).toBe(false);
  });

  it('should return false if environmentTargetNames are not present', () => {
    const config = {
      ...projectConfig,
      targets: {
        build: {},
        test: {},
      }
    }
    const result = isEnvProject(config, normalizedCreateNodeOptions);
    expect(result).toBe(false);
  });

  it('should return false if existingTargetNames, and existingTargetNames are not present ', () => {
    const result = isEnvProject(projectConfig, normalizedCreateNodeOptions);
    expect(result).toBe(false);
  });


  it('should return false if none of the existingTargetNames match any of the environmentTargetNames', () => {
    const config = {
      ...projectConfig,
      targets: {
        build: {},
        test: {},
      }
    }
    const options = {...normalizedCreateNodeOptions, targetNames: ['mockTarget']}
    const result = isEnvProject(config, options);
    expect(result).toBe(false);
  });

  it('should return true if  any existingTargetNames match environmentTargetNames and no tags', () => {
    // i have to set tags to null
    const config = {
      ...projectConfig,
      tags: null,
      targets: {
        build: {},
        test: {},
      }
    }
    const options = {...normalizedCreateNodeOptions, targetNames: ['cola', 'mock', 'build']}
    const result = isEnvProject(config, options);
    expect(result).toBe(true);
  });

  it('should return true if any existingTargetNames match environmentTargetNames and no filterByTags', () => {
    // i have to set filter by tags to null
    const config = {
      ...projectConfig,
      targets: {
        build: {},
        test: {},
      }
    }
    const options = {
      ...normalizedCreateNodeOptions,
      targetNames: ['cola', 'mock', 'build'],
      filterByTags: null
    }
    const result = isEnvProject(config, options);
    expect(result).toBe(true);
  });

  it('should return true if any existingTargetNames match environmentTargetNames and existingTags are present with environmentsTagFilters, and any existingTags match any environmentsTagFilters', () => {
    const config = {
      ...projectConfig,
      targets: {
        build: {},
        test: {},
      }
    }
    const options = {
      ...normalizedCreateNodeOptions,
      targetNames: ['cola', 'mock', 'build'],
    }
    const result = isEnvProject(config, options);
    expect(result).toBe(true);
  });

  it('should return false if any existingTargetNames match environmentTargetNames and existingTags are present with environmentsTagFilters, and NONE existingTags match any environmentsTagFilters', () => {
    const config = {
      ...projectConfig,
      targets: {
        build: {},
        test: {},
      }
    }
    const options = {
      ...normalizedCreateNodeOptions,
      targetNames: ['cola', 'mock', 'build'],
      filterByTags: ['mock-tag-no-match']
    }
    const result = isEnvProject(config, options);
    expect(result).toBe(false);
  });

})
