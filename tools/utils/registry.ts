import { gray, bold, red } from 'ansis';
import { executeProcess, objectToCliArgs } from '@org/test-utils';

export type RegistryServer = {
  protocol: string;
  port: string | number;
  host: string;
  url: string;
};
export type Registry = RegistryServer &
  Required<Pick<VerdaccioExecuterOptions, 'storage'>>;

export type RegistryResult = {
  registry: Registry;
  stop: () => void;
};

export function parseRegistryData(stdout: string): RegistryServer {
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

export type VerdaccioExecuterOptions = {
  storage?: string;
  port?: string;
  p?: string;
  config?: string;
  c?: string;
  location?: string;
  clear?: boolean;
};

export type StarVerdaccioOptions = VerdaccioExecuterOptions &
  StarVerdaccioOnlyOptions;

export async function startVerdaccioServer({
  targetName = 'local-registry',
  projectName = '',
  storage,
  port,
  location,
  clear,
  verbose = false,
}: StarVerdaccioOptions): Promise<RegistryResult> {
  let startDetected = false;

  return new Promise<RegistryResult>((resolve, reject) => {
    executeProcess({
      command: 'npm',
      args: objectToCliArgs<
        Partial<
          VerdaccioExecuterOptions & {
            _: string[];
            verbose: boolean;
            cwd: string;
          }
        >
      >({
        _: ['exec', 'nx', targetName, projectName ?? '', '--'],
        storage,
        port,
        verbose,
        location,
        clear,
      }),
      shell: true,
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
                storage,
                ...parseRegistryData(stdout),
              },
              stop: () => {
                try {
                  childProcess?.kill();
                } catch {
                  console.error(
                    `${red('>')} ${gray(
                      bold('Verdaccio')
                    )} Can't kill Verdaccio process with id: ${
                      childProcess.pid
                    }`
                  );
                }
              },
            };

            console.info(
              `${gray('>')} ${gray(
                bold('Verdaccio')
              )} Registry started on URL: ${bold(
                result.registry.url
              )}, ProcessID: ${bold(childProcess?.pid)}`
            );
            if (verbose) {
              console.info(`${gray('>')} ${gray(bold('Verdaccio'))}`);
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
