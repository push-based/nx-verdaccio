import { Environment } from '../env-bootstrap/npm';

export type SetupEnvironmentExecutorOptions = Partial<
  Environment & {
    keepServerRunning: boolean;
    progress: boolean;
    verbose: boolean;
  }
>;
