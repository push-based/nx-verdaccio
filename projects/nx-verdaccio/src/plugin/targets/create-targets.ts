import type { BuildEnvPluginCreateNodeOptions } from '../schema';
import type { CreateNodesResult, ProjectConfiguration } from '@nx/devkit';
import { logger } from '@nx/devkit';
import { normalizeCreateNodesOptions } from '../normalize-create-nodes-options';
import {
  getEnvTargets,
  isEnvProject,
  updateEnvTargetNames,
  verdaccioTargets,
} from './environment.targets';
import { getPkgTargets, isPkgProject } from './package.targets';

export function createTargets(
  projectConfiguration: ProjectConfiguration,
  options: BuildEnvPluginCreateNodeOptions
): CreateNodesResult['projects'][string]['targets'] {
  const { environments, packages } = normalizeCreateNodesOptions(options);

  if (
    !isEnvProject(projectConfiguration, environments) &&
    !isPkgProject(projectConfiguration, packages)
  ) {
    return {};
  }

  return {
    // === ENVIRONMENT TARGETS ===
    ...(isEnvProject(projectConfiguration, environments) && {
      // start-verdaccio, stop-verdaccio
      ...verdaccioTargets(projectConfiguration, {
        environmentsDir: environments.environmentsDir,
      }),
      // env-bootstrap-env, env-setup-env, install-env (intermediate target to run dependency targets)
      ...getEnvTargets(projectConfiguration, environments),
      // adjust targets to run env-setup-env
      ...updateEnvTargetNames(projectConfiguration, environments),
    }),
    // === PACKAGE TARGETS ===
    // pkg-publish, pkg-install
    ...(isPkgProject(projectConfiguration, packages) && getPkgTargets()),
  };
}
