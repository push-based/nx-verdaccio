import { logger, type ProjectConfiguration } from '@nx/devkit';
import { normalizeCreateNodesOptions } from '../normalize-create-nodes-options';
import type { NxVerdaccioCreateNodeOptions } from '../schema';
import {
  getEnvTargets,
  isEnvProject,
  updateEnvTargetNames,
  verdaccioTargets,
} from './environment.targets';
import { getPkgTargets, isPkgProject } from './package.targets';

/**
 * Generates a project configuration partial including `targets` and `namedInputs`.
 *
 * If the project is an environment project, derived by `isEnvProject()`,
 * It returns the results of `verdaccioTargets()`, `getEnvTargets()`,
 *`updateEnvTargetNames()` under `targets`, and `namedInputs`
 *
 * If the project is a publishable project, derived by `isPkgProject()`,
 * it returns the results of `getPkgTargets()`, and `namedInputs`
 *
 * Otherwise, it returns an empty object (as early exit)
 *
 * Additionally, it logs warnings for missing implicit dependencies in environment projects.
 *
 * @param projectConfiguration
 * @param options
 * @returns A partial project configuration with `targets` and `namedInputs`.
 */
export function createProjectConfiguration(
  projectConfiguration: ProjectConfiguration,
  options: NxVerdaccioCreateNodeOptions
): Pick<ProjectConfiguration, 'targets'> &
  Partial<Pick<ProjectConfiguration, 'namedInputs'>> {
  const { environments, packages } = normalizeCreateNodesOptions(options);

  const isE2eProject = isEnvProject(projectConfiguration, environments);
  const isPublishableProject = isPkgProject(projectConfiguration, packages);
  if (!isE2eProject && !isPublishableProject) {
    return {};
  }
  if (isE2eProject && !projectConfiguration.implicitDependencies?.length) {
    logger.warn(
      `Project ${projectConfiguration.name} is an environment project but has no implicit dependencies.`
    );
  }

  /**
   * When you pass your own `namedInputs` (like you would in a `project.json` file)
   * via the inferred tasks plugin, the tasks pipeline ignores them and throws this error.
   * Some Nx plugins use the default `namedInput`, probably for that reason,
   * but I'm concerned that if developers change those inputs, it might lead to undesired behaviour.
   * @todo investigate if there is a way to pass namedInputs to the tasks graph
   */
  const namedInputs: ProjectConfiguration['namedInputs'] = {
    'build-artifacts': [
      '{projectRoot}/**/*.{js,ts,tsx}',
      '!{projectRoot}/**/*.spec.{ts,tsx}',
    ],
  };
  return {
    ...(isE2eProject && {
      namedInputs,
      // === ENVIRONMENT TARGETS ===
      targets: {
        // start-verdaccio, stop-verdaccio
        ...verdaccioTargets(projectConfiguration, environments),
        // env-bootstrap-env, env-setup-env, install-env (intermediate target to run dependency targets)
        ...getEnvTargets(projectConfiguration, environments),
        // adjust targets to run env-setup-env
        ...updateEnvTargetNames(projectConfiguration, environments),
      },
    }),
    ...(isPublishableProject && {
      // === PACKAGE TARGETS ===
      targets: getPkgTargets(),
    }),
  };
}
