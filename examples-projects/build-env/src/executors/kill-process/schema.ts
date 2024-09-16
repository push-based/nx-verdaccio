export type KillProcessExecutorOptions = Partial<{
  pid: number;
  filePath: string;
  dryRun: boolean;
  cleanFs: boolean;
  verbose: boolean;
}>;
