import type {
  NxVerdaccioEnvironmentTarget,
  NxVerdaccioPackageTarget,
} from './constants';

export type NxVerdaccioEnvironmentsOptions = {
  environmentsDir?: string;
  targetNames?: string[];
  filterByTags?: string[];
  inferredTargets?: Record<NxVerdaccioEnvironmentTarget, string>;
};
export type NxVerdaccioPackagesOptions = {
  environmentsDir?: string;
  targetNames?: string[];
  filterByTags?: string[];
  inferredTargets?: Record<NxVerdaccioPackageTarget, string>;
};
export type NxVerdaccioCreateNodeOptions = {
  environments?: NxVerdaccioEnvironmentsOptions;
  packages?: NxVerdaccioPackagesOptions;
};
