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
export type NxVerdaccioCreateNodeOptions = {
  environments?: NxVerdaccioEnvironmentsOptions;
  packages?: NxVerdaccioPackagesOptions;
};
