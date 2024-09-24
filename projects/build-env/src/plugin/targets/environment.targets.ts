import type {ProjectConfiguration, TargetConfiguration} from "@nx/devkit";
import {NormalizedCreateNodeOptions} from "../normalize-create-nodes-options";
import {join} from "node:path";
import {DEFAULT_NPM_INSTALL_TARGET} from "./package.targets";
import {BuildEnvEnvironmentsOptions} from "../schema";
import type {StartVerdaccioOptions} from "../../executors/bootstrap/verdaccio-registry";
import {uniquePort} from "../../executors/bootstrap/unique-port";
import {VERDACCIO_REGISTRY_JSON} from "../../executors/bootstrap/constants";

export const DEFAULT_START_VERDACCIO_TARGET = 'build-env-verdaccio-start';
export const DEFAULT_BOOTSTRAP_TARGET = 'build-env-env-bootstrap';
export const DEFAULT_INSTALL_TARGET = 'build-env-env-install';
export const DEFAULT_SETUP_TARGET = 'build-env-env-setup';
export const DEFAULT_STOP_VERDACCIO_TARGET = 'build-env-verdaccio-stop';

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
  options: Pick<
    NormalizedCreateNodeOptions['environments'],
    'environmentsDir'
  > &
    Omit<StartVerdaccioOptions, 'projectName'>
): Record<string, TargetConfiguration> {
  const { name: envProject } = projectConfig;
  const { environmentsDir, ...verdaccioOptions } = options;
  const environmentDir = join(environmentsDir, envProject);

  return {
    [DEFAULT_START_VERDACCIO_TARGET]: {
      // @TODO: consider using the executor function directly to reduce the number of targets
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
        port: uniquePort(),
        storage: join(environmentDir, 'storage'),
        clear: true,
        environmentDir,
        projectName: envProject,
        ...verdaccioOptions,
      },
    },
    [DEFAULT_STOP_VERDACCIO_TARGET]: {
      executor: '@push-based/build-env:kill-process',
      options: {
        filePath: join(environmentsDir, VERDACCIO_REGISTRY_JSON),
        ...verdaccioOptions,
      },
    },
  };
}

export function getEnvTargets(
  projectConfig: ProjectConfiguration,
  options: NormalizedCreateNodeOptions['environments']
): Record<string, TargetConfiguration> {
  const { name: envProject } = projectConfig;
  const { environmentsDir } = options;
  const environmentRoot = join(environmentsDir, envProject);
  return {
    [DEFAULT_BOOTSTRAP_TARGET]: {
      executor: '@push-based/build-env:bootstrap',
      options: { environmentRoot },
    },
    // just here to execute dependent npm-install tasks with the correct environmentProject
    [DEFAULT_INSTALL_TARGET]: {
      dependsOn: [
        {
          projects: 'dependencies',
          target: DEFAULT_NPM_INSTALL_TARGET,
          params: 'forward',
        },
      ],
      options: { environmentRoot },
    },
    // runs bootstrap-env, install-env and stop-verdaccio
    [DEFAULT_SETUP_TARGET]: {
      outputs: ['{options.environmentRoot}'],
      executor: '@push-based/build-env:setup',
      options: {
        environmentRoot,
      },
    },
  };
}

export function updateEnvTargetNames(
  projectConfig: ProjectConfiguration,
  options: Required<Pick<BuildEnvEnvironmentsOptions, 'targetNames'>>
): Record<string, TargetConfiguration> {
  const { targetNames: envTargetNames } = options;
  const { targets: existingTargets = {} as TargetConfiguration } =
    projectConfig;

  return Object.fromEntries(
    Object.entries(existingTargets).map(([existingTargetName, config]) => {
      if (!envTargetNames.includes(existingTargetName)) {
        return [existingTargetName, config];
      }
      return [
        existingTargetName,
        {
          ...config,
          dependsOn: [
            {
              target: DEFAULT_SETUP_TARGET,
              params: 'forward',
            },
            ...(config.dependsOn ?? []),
          ],
        },
      ];
    })
  );
}
