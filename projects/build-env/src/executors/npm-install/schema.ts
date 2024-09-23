export type NpmInstallExecutorOptions = Partial<{
  pkgVersion: string;
  environmentProject: string;
  verbose: boolean;
  printConfig: boolean;
  environmentRoot: string;
}>;
