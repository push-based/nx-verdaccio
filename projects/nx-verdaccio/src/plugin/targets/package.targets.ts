import type { ProjectConfiguration, TargetConfiguration } from '@nx/devkit';
import type { NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';
import { PACKAGE_NAME } from '../constants';
import { EXECUTOR_PACKAGE_NPM_PUBLISH } from '../../executors/pkg-publish/constants';
import { EXECUTOR_PACKAGE_NPM_INSTALL } from '../../executors/pkg-install/constants';

export const TARGET_PACKAGE_INSTALL = 'nxv-pkg-install';
export const TARGET_PACKAGE_PUBLISH = 'nxv-pkg-publish';

/**
 * Determines if the given project is a `publishable` package.
 * A project qualifies as a `publishable` if it's of type 'library'.
 * If tag filters are provided only projects passing the filter will return true.
 *
 * @param projectConfig
 * @param options
 * @returns `true` if the project is a publishable; otherwise, `false`.
 */
export function isPkgProject(
  projectConfig: ProjectConfiguration,
  options: NormalizedCreateNodeOptions['packages']
): boolean {
  const { projectType, tags: existingTags = [] } = projectConfig;
  const { filterByTags: publishableTagFilters = [] } = options;
  if (projectType !== 'library') {
    return false;
  }
  // if tags are configured check for at least one given tags
  if (publishableTagFilters.length > 0) {
    return (
      existingTags.length > 0 &&
      existingTags.some((existingTag) =>
        publishableTagFilters.includes(existingTag)
      )
    );
  }

  return true;
}

/**
 * Creates package-related targets for build pipelines.
 * Includes `TARGET_PACKAGE_PUBLISH` and `TARGET_PACKAGE_INSTALL` target configurations.
 *
 * @returns A record of package targets with their configurations.
 */
export function getPkgTargets(): Record<string, TargetConfiguration> {
  return {
    [TARGET_PACKAGE_PUBLISH]: {
      dependsOn: [
        { target: 'build', params: 'forward' },
        {
          projects: 'dependencies',
          target: TARGET_PACKAGE_PUBLISH,
          params: 'forward',
        },
      ],
      executor: `${PACKAGE_NAME}:${EXECUTOR_PACKAGE_NPM_PUBLISH}`,
      options: {},
    },
    [TARGET_PACKAGE_INSTALL]: {
      dependsOn: [
        {
          target: TARGET_PACKAGE_PUBLISH,
          params: 'forward',
        },
        {
          projects: 'dependencies',
          target: TARGET_PACKAGE_INSTALL,
          params: 'forward',
        },
      ],
      executor: `${PACKAGE_NAME}:${EXECUTOR_PACKAGE_NPM_INSTALL}`,
      options: {},
    },
  };
}
