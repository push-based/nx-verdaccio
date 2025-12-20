import type { ProjectConfiguration, TargetConfiguration } from '@nx/devkit';
import { join } from 'node:path';
import {
  EXECUTOR_ENVIRONMENT_BOOTSTRAP,
  VERDACCIO_REGISTRY_JSON,
} from '../../executors/env-bootstrap/constants';
import { uniquePort } from '../../executors/env-bootstrap/unique-port';
import { EXECUTOR_ENVIRONMENT_SETUP } from '../../executors/env-setup/constants';
import { EXECUTOR_ENVIRONMENT_TEARDOWN } from '../../executors/env-teardown/constants';
import { EXECUTOR_ENVIRONMENT_KILL_PROCESS } from '../../executors/kill-process/constant';
import { iterateEntries } from '../../internal/transform';
import { PACKAGE_NAME } from '../constants';
import type { NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';
import {
  TARGET_PACKAGE_INSTALL,
  TARGET_PACKAGE_PUBLISH,
} from './package.targets';

const VERDACCIO_STORAGE_DIR = 'storage';

export function isEnvProject(
  projectConfig: ProjectConfiguration,
  options: NormalizedCreateNodeOptions['environments']
): boolean {
  const { tags: existingTags = [], targets } = projectConfig;
  const existingTargetNames = Object.keys(targets ?? {});
  const {
    filterByTags: environmentsTagFilters,
    targetNames: environmentTargetNames,
  } = options;

  if (!existingTargetNames || !environmentTargetNames) {
    return false;
  }

  if (
    existingTargetNames.some((existingTarget) =>
      environmentTargetNames.includes(existingTarget)
    )
  ) {
    if (existingTags && environmentsTagFilters) {
      return existingTags.some((existingTag) =>
        environmentsTagFilters.includes(existingTag)
      );
    }
    return true;
  }

  return false;
}

export function verdaccioTargets(
  projectConfig: ProjectConfiguration,
  options: NormalizedCreateNodeOptions['environments']
): Record<string, TargetConfiguration> {
  const { name: envProject } = projectConfig;
  const { environmentsDir, inferredTargets } = options;
  const environmentDir = join(environmentsDir, envProject);
  return {
    [inferredTargets.verdaccioStart]: {
      // @TODO: consider using the executor function directly to reduce the number of targets
      // https://github.com/nrwl/nx/blob/b73f1e0e0002c55fc0bacaa1557140adb9eec8de/packages/js/src/executors/verdaccio/verdaccio.impl.ts#L22
      outputs: [`{options.environmentRoot}/${VERDACCIO_STORAGE_DIR}`],
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
        port: uniquePort(),
        storage: join(environmentDir, VERDACCIO_STORAGE_DIR),
        clear: true,
        environmentDir,
        projectName: envProject,
      },
    },
    [inferredTargets.verdaccioStop]: {
      executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_KILL_PROCESS}`,
      options: {
        filePath: join(environmentsDir, VERDACCIO_REGISTRY_JSON),
      },
    },
  };
}

/**
 * Create new targets wrapping env-bootstrap, env-setup executors
 * install-env (intermediate target to run dependency targets)
 *
 * @param projectConfig
 * @param options
 * @returns
 */
export function getEnvTargets(
  projectConfig: ProjectConfiguration,
  options: NormalizedCreateNodeOptions['environments']
): Record<string, TargetConfiguration> {
  const { name: envProject } = projectConfig;
  const { environmentsDir, targetNames, inferredTargets } = options;
  const environmentRoot = join(environmentsDir, envProject);
  return {
    [inferredTargets.bootstrap]: {
      executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_BOOTSTRAP}`,
      options: {
        verdaccioStartTarget: inferredTargets.verdaccioStart,
        verdaccioStopTarget: inferredTargets.verdaccioStop,
      },
    },
    // intermediate task just here to execute dependent pkg-install tasks with the correct environmentProject
    [inferredTargets.install]: {
      dependsOn: [
        {
          projects: 'dependencies',
          target: TARGET_PACKAGE_INSTALL,
          params: 'forward',
        },
      ],
      options: { environmentRoot },
      // This is here to make it appear in the graph in older nx versions (otherwise it is filtered out)
      command: `echo "dependencies installed for ${environmentRoot}"`,
    },
    // intermediate task just here to execute dependent pkg-publish tasks with the correct environmentProject
    [inferredTargets.publishOnly]: {
      dependsOn: [
        {
          projects: 'dependencies',
          target: TARGET_PACKAGE_PUBLISH,
          params: 'forward',
        },
      ],
      options: { environmentRoot },
      // This is here to make it appear in the graph in older nx versions (otherwise it is filtered out)
      command: `echo "dependencies published for ${environmentRoot}"`,
    },
    // runs env-bootstrap-env, install-env and stop-verdaccio
    [inferredTargets.setup]: {
      // list of inputs that all subsequent tasks depend on
      inputs: [
        '{projectRoot}/project.json',
        {
          runtime: 'node --version',
        },
        {
          runtime: 'npm --version',
        },
        {
          externalDependencies: ['verdaccio'],
        },
        // depends on underlying project being e2e tested and its own dependencies
        // ! it's important that implicitDependencies are correctly configured between this project and the project being tested
        // '^build-artifacts',
        '^production',
      ],
      outputs: [
        '{options.environmentRoot}/.npmrc',
        '{options.environmentRoot}/package.json',
        '{options.environmentRoot}/package-lock.json',
        '{options.environmentRoot}/node_modules',
      ],
      cache: true,
      executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_SETUP}`,
      options: {
        envBootstrapTarget: inferredTargets.bootstrap,
        envInstallTarget: inferredTargets.install,
        envPublishOnlyTarget: inferredTargets.publishOnly,
        verdaccioStopTarget: inferredTargets.verdaccioStop,
      },
    },
    [inferredTargets.teardown]: {
      executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_TEARDOWN}`,
    },
    [inferredTargets.e2e]: {
      dependsOn: targetNames.map((targetName) => ({
        target: targetName,
        params: 'forward',
      })),
      executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_TEARDOWN}`,
    },
  };
}

/**
 * adjust targets to run env-setup-env
 * this will add the dependsOn property to the targets that are in the targetNames array (usually e2e)
 * @param projectConfig
 * @param options
 * @returns
 */
export function updateEnvTargetNames(
  projectConfig: ProjectConfiguration,
  options: NormalizedCreateNodeOptions['environments']
): Record<string, TargetConfiguration> {
  const { targetNames: envTargetNames, inferredTargets } = options;
  const { targets: existingTargets = {} as TargetConfiguration } =
    projectConfig;

  return iterateEntries(existingTargets, (entries) =>
    entries.map(([existingTargetName, config]) => {
      if (!envTargetNames.includes(existingTargetName)) {
        return [existingTargetName, config];
      }
      return [
        existingTargetName,
        {
          ...config,
          dependsOn: [
            { target: inferredTargets.setup, params: 'forward' },
            ...(config.dependsOn ?? []),
          ],
        },
      ];
    })
  );
}
