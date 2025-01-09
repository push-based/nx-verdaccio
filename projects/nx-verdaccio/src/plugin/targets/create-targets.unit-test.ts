import { beforeEach, describe, MockInstance } from 'vitest';
import { ProjectConfiguration } from '@nx/devkit';

import { createProjectConfiguration } from './create-targets';

import { NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';
import {
  NxVerdaccioCreateNodeOptions,
  NxVerdaccioEnvironmentsOptions,
  NxVerdaccioPackagesOptions,
} from '../schema';

import * as normalizeCreateNodesModule from './../normalize-create-nodes-options';
import * as environmentTargetsModule from './environment.targets';
import * as packageTargetsModule from './package.targets';

describe('createProjectConfiguration', (): void => {
  const config: ProjectConfiguration = {
    root: 'mock-root',
    name: 'unit-test-project',
    targets: { build: { executor: 'nx:build', options: {} } },
    tags: ['env:production'],
  };

  const normalizedOptions: NormalizedCreateNodeOptions = {
    environments: {
      targetNames: ['build'],
      environmentsDir: './environments',
    },
    packages: {
      targetNames: ['test', 'lint'],
      environmentsDir: './packages',
      filterByTags: ['env:production', 'utility'],
    },
  };

  const options: NxVerdaccioCreateNodeOptions = {
    environments: {
      targetNames: ['build'], // Minimal required to pass validation
    },
  };

  let normalizeCreateNodesOptionsSpy: MockInstance<
    [options: NxVerdaccioCreateNodeOptions],
    NormalizedCreateNodeOptions
  >;

  let isEnvProjectSpy: MockInstance<
    [
      projectConfig: ProjectConfiguration,
      options: NormalizedCreateNodeOptions['environments']
    ],
    boolean
  >;

  let isPkgSpy: MockInstance<
    [projectConfig: ProjectConfiguration, options: NxVerdaccioPackagesOptions],
    boolean
  >;

  beforeEach((): void => {
    normalizeCreateNodesOptionsSpy = vi
      .spyOn(normalizeCreateNodesModule, 'normalizeCreateNodesOptions')
      .mockReturnValue(normalizedOptions);
    isEnvProjectSpy = vi
      .spyOn(environmentTargetsModule, 'isEnvProject')
      .mockReturnValue(true);
    isPkgSpy = vi
      .spyOn(packageTargetsModule, 'isPkgProject')
      .mockReturnValue(true);
  });

  afterEach((): void => {
    normalizeCreateNodesOptionsSpy.mockRestore();
  });

  it('should call normalizeCreateNodesOptions ones with config and options', (): void => {
    createProjectConfiguration(config, options);
    expect(
      normalizeCreateNodesModule.normalizeCreateNodesOptions
    ).toHaveBeenCalledOnce();
    expect(
      normalizeCreateNodesModule.normalizeCreateNodesOptions
    ).toHaveBeenCalledWith(options);
  });

  it('should call isEnvProject ones with projectConfiguration and environments', (): void => {
    createProjectConfiguration(config, options);
    expect(environmentTargetsModule.isEnvProject).toHaveBeenCalledOnce();
    expect(environmentTargetsModule.isEnvProject).toHaveBeenCalledWith(
      config,
      normalizedOptions['environments']
    );
  });

  it('should call isPublishableProject ones with projectConfiguration and packages', (): void => {
    createProjectConfiguration(config, options);
    expect(packageTargetsModule.isPkgProject).toHaveBeenCalledOnce();
    expect(packageTargetsModule.isPkgProject).toHaveBeenCalledWith(
      config,
      normalizedOptions['packages']
    );
  });

  //  if (!isE2eProject && !isPublishableProject) {
  //     return {};
  //   }
  it('should return empty object if !isE2eProject and !isPublishableProject', (): void => {});

  //  if (isE2eProject && !projectConfiguration.implicitDependencies?.length) {
  //     logger.warn(
  //       `Project ${projectConfiguration.name} is an environment project but has no implicit dependencies.`
  //     );
  //   }
  // i need a spy or mock for warn? idk
  it('should log warn if isE2eProject and !projectConfiguration.implicitDependencies?.length', (): void => {});

  // i should check for ENVIRONMENT TARGETS structure and PACKAGE TARGETS
  it('should generate project configuration with correct structure', (): void => {});

  // spies
  //   ...verdaccioTargets(projectConfiguration, {
  //           environmentsDir: environments.environmentsDir,
  //         }
  it('should call verdaccioTargets ones with correct arguments', (): void => {});

  // ...getEnvTargets(projectConfiguration, environments)
  it('should call verdaccioTargets ones with correct arguments', (): void => {});

  // ...updateEnvTargetNames(projectConfiguration
  it('should call updateEnvTargetNames ones with correct arguments', (): void => {});

  //getPkgTargets() not sure if this should be a spy
});
