import { bold } from 'ansis';
import { join } from 'node:path';
import { logger } from '@nx/devkit';
import { objectToCliArgs } from '../../internal/terminal';
import { executeProcess } from '../../internal/execute-process';
import { uniquePort } from './unique-port';
import { getEnvironmentsRoot } from '../../internal/setup';
import { formatError, formatInfo } from '../../internal/logging';
import { DEFAULT_START_VERDACCIO_TARGET } from '../../internal/constants';

const VERDACCIO_TOKEN = 'Verdaccio: ';

export type VerdaccioProcessResult = {
  protocol: string;
  port: string | number;
  host: string;
  url: string;
};
export type VercaddioServerResult = VerdaccioProcessResult & {
  pid: number;
} & Required<Pick<VerdaccioExecuterOptions, 'storage'>>;

export type RegistryResult = {
  registry: VercaddioServerResult;
  stop: () => void;
};

export function parseRegistryData(stdout: string): VerdaccioProcessResult {
  // Extract protocol, host, and port
  const match = stdout.match(
    /(?<proto>https?):\/\/(?<host>[^:]+):(?<port>\d+)/
  );

  if (!match?.groups) {
    throw new Error('Could not parse registry data from stdout');
  }

  const protocol = match.groups['proto'];
  if (!protocol || !['http', 'https'].includes(protocol)) {
    throw new Error(
      `Invalid protocol ${protocol}. Only http and https are allowed.`
    );
  }
  const host = match.groups['host'];
  if (!host) {
    throw new Error(`Invalid host ${String(host)}.`);
  }
  const port = match.groups['port'] ? Number(match.groups['port']) : undefined;
  if (!port) {
    throw new Error(`Invalid port ${String(port)}.`);
  }
  return {
    protocol,
    host,
    port,
    url: `${protocol}://${host}:${port}`,
  };
}

export type StarVerdaccioOnlyOptions = {
  projectName?: string;
  verbose?: boolean;
};

export type VerdaccioExecuterOptions = {
  readyWhen?: string;
  storage?: string;
  port?: string;
  config?: string;
  location?: string;
  clear?: boolean;
};

export type StarVerdaccioOptions = VerdaccioExecuterOptions &
  StarVerdaccioOnlyOptions;

export async function startVerdaccioServer({
  projectName,
  port = String(uniquePort()),
  storage = join(getEnvironmentsRoot(projectName), 'storage'),
  location = 'none',
  clear = true,
  verbose = true,
  ...opt
}: StarVerdaccioOptions): Promise<RegistryResult> {
  let verdaccioIsRunning = false;

  const startServerPromise = () =>
    new Promise<RegistryResult>((resolve, reject) => {
      executeProcess({
        command: 'nx',
        args: objectToCliArgs({
          _: [DEFAULT_START_VERDACCIO_TARGET, projectName ?? '', '--'],
          storage,
          port,
          verbose,
          location,
          clear,
          ...opt,
        }),
        // This ensures the process runs independently and does not get closed on parent process exit
        detached: true,
        shell: true,
        observer: {
          onStdout: (stdout: string, childProcess) => {
            if (verbose) {
              process.stdout.write(formatInfo(stdout, VERDACCIO_TOKEN));
            }

            // Log of interest: warn --- http address - http://localhost:<PORT-NUMBER>/ - verdaccio/5.31.1
            if (!verdaccioIsRunning && stdout.includes('http://localhost:')) {
              verdaccioIsRunning = true;

              const result: RegistryResult = {
                registry: {
                  pid: Number(childProcess?.pid),
                  storage,
                  ...parseRegistryData(stdout),
                },
                stop: () => {
                  try {
                    childProcess?.kill();
                  } catch {
                    logger.error(
                      formatError(
                        `Can't kill Verdaccio process with id: ${childProcess?.pid}`,
                        VERDACCIO_TOKEN
                      )
                    );
                  }
                },
              };

              logger.info(
                formatInfo(
                  `Registry started on URL: ${bold(
                    result.registry.url
                  )}, ProcessID: ${bold(String(childProcess?.pid))}`,
                  VERDACCIO_TOKEN
                )
              );
              if (verbose) {
                logger.info(formatInfo('', VERDACCIO_TOKEN));
                console.table(result);
              }

              resolve(result);
            }
          },
          onStderr: (stderr: string) => {
            if (verbose) {
              process.stdout.write(formatInfo(stderr, VERDACCIO_TOKEN));
            }
          },
        },
      }).catch((error) => {
        logger.error(formatError(error, VERDACCIO_TOKEN));
        reject(error);
      });
    });

  try {
    return await startServerPromise();
  } catch (error) {
    logger.error(formatError(error, VERDACCIO_TOKEN));
    throw error;
  }
}
