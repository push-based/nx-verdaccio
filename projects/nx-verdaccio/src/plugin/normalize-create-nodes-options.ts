import type {
  NxVerdaccioEnvironmentsOptions,
  NxVerdaccioCreateNodeOptions,
  NxVerdaccioPackagesOptions,
} from './schema';
import {
  DEFAULT_ENVIRONMENTS_OUTPUT_DIR,
  DEFAULT_OPTION_ENVIRONMENT_TARGET_NAMES,
} from './constants';

export type NormalizedCreateNodeOptions = {
  environments: Omit<
    NxVerdaccioEnvironmentsOptions,
    'targetNames' | 'environmentsDir'
  > &
    Required<
      Pick<NxVerdaccioEnvironmentsOptions, 'targetNames' | 'environmentsDir'>
    >;
  packages: NxVerdaccioPackagesOptions;
};

export function normalizeCreateNodesOptions(
  options: NxVerdaccioCreateNodeOptions
): NormalizedCreateNodeOptions {
  const { environments = {}, packages = {} } = options ?? {};
  const { targetNames = [] } = environments;

  if (targetNames.length === 0) {
    throw new Error(
      'Option targetNames is required in plugin options under "environments". e.g.: ["e2e"] '
    );
  }

  return <NormalizedCreateNodeOptions>{
    environments: {
      environmentsDir: DEFAULT_ENVIRONMENTS_OUTPUT_DIR,
      targetNames: [DEFAULT_OPTION_ENVIRONMENT_TARGET_NAMES],
      ...environments,
    },
    packages: {
      ...packages,
    },
  };
}
