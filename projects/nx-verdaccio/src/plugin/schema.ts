export type BuildEnvEnvironmentsOptions = {
  environmentsDir?: string;
  targetNames?: string[];
  filterByTags?: string[];
};
export type BuildEnvPackagesOptions = {
  environmentsDir?: string;
  targetNames?: string[];
  filterByTags?: string[];
};
export type BuildEnvPluginCreateNodeOptions = {
  environments?: BuildEnvEnvironmentsOptions;
  packages?: BuildEnvPackagesOptions;
};
