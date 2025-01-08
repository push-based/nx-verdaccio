import { describe } from 'vitest';

describe('createProjectConfiguration', (): void => {

  // spies
  //  const { environments, packages } = normalizeCreateNodesOptions(options);
  it('should call normalizeCreateNodesOptions ones with options', (): void => {

  });
  //  const isE2eProject = isEnvProject(projectConfiguration, environments);
  it('should call normalizeCreateNodesOptions ones with projectConfiguration and environments', (): void => {

  });
  //  const isPublishableProject = isPkgProject(projectConfiguration, packages);
  it('should call isPublishableProject ones with projectConfiguration and packages', (): void => {

  });

  //  if (!isE2eProject && !isPublishableProject) {
  //     return {};
  //   }
  it('should return empty object if !isE2eProject and !isPublishableProject', (): void => {

  })

  //  if (isE2eProject && !projectConfiguration.implicitDependencies?.length) {
  //     logger.warn(
  //       `Project ${projectConfiguration.name} is an environment project but has no implicit dependencies.`
  //     );
  //   }
  // i need a spy or mock for warn? idk
  it('should log warn if isE2eProject and !projectConfiguration.implicitDependencies?.length', (): void => {

  })

  // i should check for ENVIRONMENT TARGETS structure and PACKAGE TARGETS
  it('should generate project configuration with correct structure', (): void => {

  });

  // spies
  //   ...verdaccioTargets(projectConfiguration, {
  //           environmentsDir: environments.environmentsDir,
  //         }
  it('should call verdaccioTargets ones with correct arguments', (): void => {

  });

  // ...getEnvTargets(projectConfiguration, environments)
  it('should call verdaccioTargets ones with correct arguments', (): void => {

  });

  // ...updateEnvTargetNames(projectConfiguration
  it('should call updateEnvTargetNames ones with correct arguments', (): void => {

  });

  //getPkgTargets() not sure if this should be a spy
})
