import type {ProjectConfiguration, TargetConfiguration} from "@nx/devkit";
import {NormalizedCreateNodeOptions} from "../normalize-create-nodes-options";

export const DEFAULT_NPM_INSTALL_TARGET = 'build-env-release-install';
export const DEFAULT_NPM_PUBLISH_TARGET = 'build-env-release-publish';

export function isPkgProject(
  projectConfig: ProjectConfiguration,
  options: NormalizedCreateNodeOptions['publishable']
): boolean {
  const { projectType, tags: existingTags = [] } = projectConfig;
  const { filterByTags: publishableTagFilters } = options;
  if (projectType !== 'library') {
    return false;
  }
  // if tags are configured check for at least one given tags
  if (existingTags && publishableTagFilters) {
    return existingTags.some((existingTag) =>
      publishableTagFilters.includes(existingTag)
    );
  }

  return true;
}

export function getPkgTargets(): Record<string, TargetConfiguration> {
  return {
    [DEFAULT_NPM_PUBLISH_TARGET]: {
      dependsOn: [
        { target: 'build', params: 'forward' },
        {
          projects: 'dependencies',
          target: DEFAULT_NPM_PUBLISH_TARGET,
          params: 'forward',
        },
      ],
      executor: '@push-based/build-env:npm-publish',
    },
    [DEFAULT_NPM_INSTALL_TARGET]: {
      dependsOn: [
        {
          target: DEFAULT_NPM_PUBLISH_TARGET,
          params: 'forward',
        },
        {
          projects: 'dependencies',
          target: DEFAULT_NPM_INSTALL_TARGET,
          params: 'forward',
        },
      ],
      executor: '@push-based/build-env:npm-install',
    },
  };
}
