export type NpmInstallExecutorOptions = Partial<{
  pkgVersion: string;
  verbose: boolean;
  printConfig: boolean;
  releaseTarget: string;
  distPath: string;
  environmentRoot: string;
}>;
