export type NpmPublishExecutorOptions = Partial<{
  environmentRoot: string;
  releaseTarget: string;
  distPath: string;
  verbose: boolean;
  printConfig: boolean;
}>;
