import type { Environment } from '../env-bootstrap/npm';

export type SetupEnvironmentExecutorOptions = Partial<
  Environment & {
    keepServerRunning: boolean;
    skipInstall: boolean;
    postScript: string;
    verbose: boolean;
    envBootstrapTarget?: string;
    envPublishOnlyTarget?: string;
    envInstallTarget?: string;
    verdaccioStopTarget?: string;
  }
>;
