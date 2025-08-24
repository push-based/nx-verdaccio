import {
  DEFAULT_ENVIRONMENT_TARGETS,
  DEFAULT_ENVIRONMENTS_OUTPUT_DIR,
  DEFAULT_OPTION_ENVIRONMENT_TARGET_NAMES,
  DEFAULT_PACKAGE_TARGETS,
} from './constants';
import type {
  NxVerdaccioCreateNodeOptions,
  NxVerdaccioEnvironmentsOptions,
  NxVerdaccioPackagesOptions,
} from './schema';
import type { WithRequired } from './utils/type.utils';

export type NormalizedCreateNodeOptions = {
  environments: WithRequired<
    NxVerdaccioEnvironmentsOptions,
    'targetNames' | 'environmentsDir' | 'inferredTargets'
  >;
  packages: WithRequired<NxVerdaccioPackagesOptions, 'inferredTargets'>;
};

export function normalizeCreateNodesOptions(
  options: NxVerdaccioCreateNodeOptions
): NormalizedCreateNodeOptions {
  const { environments = {}, packages = {} } = options ?? {};
  const { targetNames = [] } = environments;

  if (targetNames.length === 0) {
    throw new Error(
      'Option targetNames is required in plugin options under "environments". e.g.: ["e2e"]'
    );
  }

  return {
    environments: {
      environmentsDir: DEFAULT_ENVIRONMENTS_OUTPUT_DIR,
      ...environments,
      targetNames:
        environments.targetNames || DEFAULT_OPTION_ENVIRONMENT_TARGET_NAMES,
      inferredTargets: {
        ...DEFAULT_ENVIRONMENT_TARGETS,
        ...environments.inferredTargets,
      },
    },
    packages: {
      ...packages,
      inferredTargets: {
        ...DEFAULT_PACKAGE_TARGETS,
        ...packages.inferredTargets,
      },
    },
  };
}
