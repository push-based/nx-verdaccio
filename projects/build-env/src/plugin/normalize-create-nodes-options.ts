import {
  BuildEnvEnvironmentsOptions,
  BuildEnvPluginCreateNodeOptions,
  BuildEnvPublishingOptions
} from "./schema";
import {DEFAULT_ENVIRONMENTS_OUTPUT_DIR, DEFAULT_OPTION_ENVIRONMENT_TARGET_NAMES} from "./constants";

export type NormalizedCreateNodeOptions = {
  environments: Omit<
    BuildEnvEnvironmentsOptions,
    'targetNames' | 'environmentsDir'
  > &
    Required<
      Pick<BuildEnvEnvironmentsOptions, 'targetNames' | 'environmentsDir'>
    >;
  publishable: BuildEnvPublishingOptions;
};

export function normalizeCreateNodesOptions(
  options: BuildEnvPluginCreateNodeOptions
): NormalizedCreateNodeOptions {
  const {
    environments: givenEnvironments = {},
    publishable: givenPublishable = {},
  } = options ?? {};

  if (
    !('targetNames' in givenEnvironments) ||
    givenEnvironments.targetNames.length === 0
  ) {
    throw new Error(
      'Option targetNames is required in plugin options under "environments". e.g.: ["e2e"] '
    );
  }

  return <NormalizedCreateNodeOptions>{
    environments: {
      environmentsDir: DEFAULT_ENVIRONMENTS_OUTPUT_DIR,
      targetNames: [DEFAULT_OPTION_ENVIRONMENT_TARGET_NAMES],
      ...givenEnvironments,
    },
    publishable: {
      ...givenPublishable,
    },
  };
}
