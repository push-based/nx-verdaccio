export type NpmInstallExecutorOptions = Partial<{
  pkgVersion: string;
  verbose: boolean;
  printConfig: boolean;
  environmentRoot: string;
}>;
