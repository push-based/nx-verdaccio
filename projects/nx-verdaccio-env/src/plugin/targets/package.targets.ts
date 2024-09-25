import type { ProjectConfiguration, TargetConfiguration } from '@nx/devkit';
import type { NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';
import { PACKAGE_NAME } from '../constants';
import { EXECUTOR_PACKAGE_NPM_PUBLISH } from '../../executors/npm-publish/constants';
import { EXECUTOR_PACKAGE_NPM_INSTALL } from '../../executors/npm-install/constants';

export const TARGET_PACKAGE_NPM_INSTALL = 'pb-ve-pkg-install';
export const TARGET_PACKAGE_NPM_PUBLISH = 'pb-ve-pkg-publish';

export function isPkgProject(
  projectConfig: ProjectConfiguration,
  options: NormalizedCreateNodeOptions['packages']
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
    [TARGET_PACKAGE_NPM_PUBLISH]: {
      dependsOn: [
        { target: 'build', params: 'forward' },
        {
          projects: 'dependencies',
          target: TARGET_PACKAGE_NPM_PUBLISH,
          params: 'forward',
        },
      ],
      executor: `${PACKAGE_NAME}:${EXECUTOR_PACKAGE_NPM_PUBLISH}`,
    },
    [TARGET_PACKAGE_NPM_INSTALL]: {
      dependsOn: [
        {
          target: TARGET_PACKAGE_NPM_PUBLISH,
          params: 'forward',
        },
        {
          projects: 'dependencies',
          target: TARGET_PACKAGE_NPM_INSTALL,
          params: 'forward',
        },
      ],
      executor: `${PACKAGE_NAME}:${EXECUTOR_PACKAGE_NPM_INSTALL}`,
    },
  };
}
