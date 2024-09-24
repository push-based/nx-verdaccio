export type BuildEnvEnvironmentsOptions = {
  environmentsDir?: string;
  targetNames?: string[];
  filterByTags?: string[];
};
export type BuildEnvPublishingOptions = {
  environmentsDir?: string;
  targetNames?: string[];
  filterByTags?: string[];
};
export type BuildEnvPluginCreateNodeOptions = {
  environments?: BuildEnvEnvironmentsOptions;
  publishable?: BuildEnvPublishingOptions;
};
