export type NpmPublishExecutorOptions = Partial<{
  environmentRoot: string;
  verbose: boolean;
  releaseTarget: string;
  optionsOutputPathKey: string;
  printConfig: boolean;
}>;
