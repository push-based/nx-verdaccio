import { type Environment } from './npm';

export type BootstrapExecutorOptions = Partial<
  {
    keepServerRunning: boolean;
    printConfig: boolean;
    verbose: boolean;
  } & Environment
>;
