import type { BuildEnvPluginCreateNodeOptions } from '../schema';
import type { ProjectConfiguration } from '@nx/devkit';
import { normalizeCreateNodesOptions } from '../normalize-create-nodes-options';
import {
  getEnvTargets,
  isEnvProject,
  updateEnvTargetNames,
  verdaccioTargets,
} from './environment.targets';
import { getPkgTargets, isPkgProject } from './package.targets';

export function createProjectConfiguration(
  projectConfiguration: ProjectConfiguration,
  options: BuildEnvPluginCreateNodeOptions
): Pick<ProjectConfiguration, 'targets'> &
  Partial<Pick<ProjectConfiguration, 'namedInputs'>> {
  const { environments, packages } = normalizeCreateNodesOptions(options);

  if (
    !isEnvProject(projectConfiguration, environments) &&
    !isPkgProject(projectConfiguration, packages)
  ) {
    return {};
  }

  // unfortunately namedInputs are not picked up by tasks graph: Error: Input 'build-artifacts' is not defined
  const namedInputs: ProjectConfiguration['namedInputs'] = {
    'build-artifacts': [
      '{projectRoot}/**/*.{js,ts,tsx}',
      '!{projectRoot}/**/*.spec.{ts,tsx}',
    ],
  };
  return {
    ...(isEnvProject(projectConfiguration, environments) && {
      namedInputs,
      // === ENVIRONMENT TARGETS ===
      targets: {
        // start-verdaccio, stop-verdaccio
        ...verdaccioTargets(projectConfiguration, {
          environmentsDir: environments.environmentsDir,
        }),
        // env-bootstrap-env, env-setup-env, install-env (intermediate target to run dependency targets)
        ...getEnvTargets(projectConfiguration, environments),
        // adjust targets to run env-setup-env
        ...updateEnvTargetNames(projectConfiguration, environments),
      },
    }),
    ...(isPkgProject(projectConfiguration, packages) && {
      // === PACKAGE TARGETS ===
      targets: getPkgTargets(),
    }),
  };
}
