import { gray, bold, red } from 'ansis';

import { join } from 'node:path';
import { error, info } from '../utils/logging';
import { VerdaccioExecutorSchema } from '@nx/js/src/executors/verdaccio/schema';
import { executeProcess, objectToCliArgs } from '@push-based/test-utils';

export function logInfo(msg: string) {
  info(msg, 'Verdaccio: ');
}

export function logError(msg: string) {
  error(msg, 'Verdaccio: ');
}

export type VerdaccioProcessResult = {
  protocol: string;
  port: string | number;
  host: string;
  url: string;
};
export type VercaddioServerResult = VerdaccioProcessResult & {
  pid: number;
} & Required<Pick<VerdaccioExecutorSchema, 'storage'>>;

export type RegistryResult = {
  registry: VercaddioServerResult;
  stop: () => void;
};

export function parseRegistryData(stdout: string): VerdaccioProcessResult {
  const output = stdout.toString();

  // Extract protocol, host, and port
  const match = output.match(
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
  const port = !Number.isNaN(Number(match.groups['port']))
    ? Number(match.groups['port'])
    : undefined;
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
  targetName?: string;
  projectName?: string;
  verbose?: boolean;
};

export type StarVerdaccioOptions = Partial<VerdaccioExecutorSchema> &
  StarVerdaccioOnlyOptions;

export async function startVerdaccioServer({
  targetName = 'start-verdaccio',
  projectName,
  storage = join('tmp', targetName, 'storage'),
  port = 4873,
  location = 'none',
  clear = true,
  verbose = false,
}: StarVerdaccioOptions): Promise<RegistryResult> {
  let startDetected = false;

  return new Promise<RegistryResult>((resolve, reject) => {
    executeProcess({
      command: 'npx',
      args: objectToCliArgs({
        _: ['nx', targetName, projectName ?? '', '--'],
        storage,
        port,
        verbose,
        location,
        clear,
      }),
      shell: true,
      windowsHide: true,
      observer: {
        onStdout: (stdout: string, childProcess) => {
          if (verbose) {
            process.stdout.write(
              `${gray('>')} ${gray(bold('Verdaccio'))} ${stdout}`
            );
          }

          // Log of interest: warn --- http address - http://localhost:<PORT-NUMBER>/ - verdaccio/5.31.1
          if (!startDetected && stdout.includes('http://localhost:')) {
            startDetected = true;

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
                  logError(
                    `Can't kill Verdaccio process with id: ${childProcess?.pid}`
                  );
                }
              },
            };

            logInfo(
              `Registry started on URL: ${bold(
                result.registry.url
              )}, ProcessID: ${bold(String(childProcess?.pid))}`
            );
            if (verbose) {
              logInfo('');
              console.table(result);
            }

            resolve(result);
          }
        },
        onStderr: (stderr: string) => {
          if (verbose) {
            process.stdout.write(
              `${red('>')} ${red(bold('Verdaccio'))} ${stderr}`
            );
          }
        },
      },
    }).catch((error) => {
      reject(error);
    });
  }).catch((error: unknown) => {
    throw error;
  });
}
