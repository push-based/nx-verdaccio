
import {join} from "node:path";
import {executeProcess} from "test-utils";
import {startVerdaccioServer} from "../../../tools/utils/registry";

const isVerbose: boolean = true;// process.env.NX_VERBOSE_LOGGING === 'true' ?? false;
let stopRegistry;

export async function setup() {

  // start registry
  stopRegistry = await startVerdaccioServer({
    targetName: 'local-registry',
    storage: join('tmp', 'cli-source', 'local-registry', 'storage'),
    verbose: isVerbose,
    port: '4873'
  });


  // package publish all projects
  await executeProcess({
    command: 'nx',
    args: ['run-many', '-t=nx-release-publish', '--registry=http://localhost:4873'],
    observer: {
      onStdout: stdout => {
        if (isVerbose) {
          console.info(stdout)
        }
      },
      onStderr: stdout => {
        if (isVerbose) {
          console.error(stdout)
        }
      }
    },
  });
  // package install all projects
  await executeProcess({
    command: 'nx',
    args: ['run-many', '-t=npm-install', '--registry=http://localhost:4873'],
    observer: {
      onStdout: stdout => {
        if (isVerbose) {
          console.info(stdout)
        }
      },
      onStderr: stdout => {
        if (isVerbose) {
          console.error(stdout)
        }
      }
    },
  });
}

export async function teardown() {
  // stop registry
  stopRegistry()
}
