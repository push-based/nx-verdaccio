import type { ProjectConfiguration, TargetConfiguration } from '@nx/devkit';
import type { NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';
import { PACKAGE_NAME } from '../constants';
import { EXECUTOR_PACKAGE_NPM_PUBLISH } from '../../executors/pkg-publish/constants';
import { EXECUTOR_PACKAGE_NPM_INSTALL } from '../../executors/pkg-install/constants';

export const TARGET_PACKAGE_INSTALL = 'nxv-pkg-install';
export const TARGET_PACKAGE_PUBLISH = 'nxv-pkg-publish';

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

export function getPkgTargets(
  projectConfig: ProjectConfiguration
): Record<string, TargetConfiguration> {
  const buildTarget = projectConfig.targets?.['build'];
  const outputPath = buildTarget?.options?.['outputPath'];

  console.log(`DEBUG: getPkgTargets for project "${projectConfig.name}":`, {
    hasTargets: !!projectConfig.targets,
    targetKeys: Object.keys(projectConfig.targets || {}),
    buildTarget: buildTarget
      ? {
          executor: buildTarget.executor,
          hasOptions: !!buildTarget.options,
          outputPath: buildTarget.options?.['outputPath'],
        }
      : null,
    fullProjectConfig: JSON.stringify(projectConfig, null, 2),
  });

  if (!outputPath) {
    // Log a warning instead of throwing an error to prevent plugin from failing to load
    console.warn(
      `Warning: Project "${projectConfig.name}" is missing outputPath in build target. ` +
        `Package targets require a build target with outputPath option. Skipping package target creation.`
    );
    return {};
  }

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
      options: { outputPath },
    },
  };
}
