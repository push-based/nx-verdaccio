export type NxVerdaccioEnvironmentsOptions = {
  environmentsDir?: string;
  targetNames?: string[];
  filterByTags?: string[];
};
export type NxVerdaccioPackagesOptions = {
  environmentsDir?: string;
  targetNames?: string[];
  filterByTags?: string[];
};
export type BuildEnvPluginCreateNodeOptions = {
  environments?: NxVerdaccioEnvironmentsOptions;
  packages?: NxVerdaccioPackagesOptions;
};
