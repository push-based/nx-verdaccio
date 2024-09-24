import {type CreateNodes, type ProjectConfiguration, readJsonFile,} from '@nx/devkit';
import {dirname, join} from 'node:path';
import {getEnvTargets, isEnvProject, updateEnvTargetNames, verdaccioTargets} from "./targets/environment.targets";
import {getPkgTargets, isPkgProject} from "./targets/package.targets";
import {BuildEnvPluginCreateNodeOptions} from "./schema";
import {normalizeCreateNodesOptions} from "./normalize-create-nodes-options";

export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile: string, opt: BuildEnvPluginCreateNodeOptions) => {
    const {environments, publishable} = normalizeCreateNodesOptions(opt);

    const projectConfiguration: ProjectConfiguration = readJsonFile(
      join(process.cwd(), projectConfigurationFile)
    );

    if (
      !('name' in projectConfiguration) ||
      typeof projectConfiguration.name !== 'string'
    ) {
      throw new Error('Project name is required');
    }
    const projectRoot = dirname(projectConfigurationFile);

    if (
      !isEnvProject(projectConfiguration, environments) &&
      !isPkgProject(projectConfiguration, publishable)
    ) {
      return {};
    }

    return {
      projects: {
        [projectRoot]: {
          targets: {
            // === environment targets ===
            ...(isEnvProject(projectConfiguration, environments) && {
              // start-verdaccio, stop-verdaccio
              ...verdaccioTargets(projectConfiguration, {
                environmentsDir: environments.environmentsDir,
              }),
              // bootstrap-env, setup-env, install-env (intermediate target to run dependency targets)
              ...getEnvTargets(projectConfiguration, environments),
              // adjust targets to run setup-env
              ...updateEnvTargetNames(projectConfiguration, environments)
            }),
            // === package targets ===
            // npm-publish, npm-install
            ...(isPkgProject(projectConfiguration, publishable) &&
              getPkgTargets()),
          },
        },
      },
    };
  },
];

