import { type Environment } from '../env-bootstrap/npm';

export type TeardownExecutorOptions = Partial<
  Environment & {
    verbose: boolean;
  }
>;
