import { beforeEach, describe, expect, MockInstance } from 'vitest';
import { ProjectConfiguration } from '@nx/devkit';

import { createProjectConfiguration } from './create-targets';

import { NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';
import {
  NxVerdaccioCreateNodeOptions,
  NxVerdaccioPackagesOptions,
} from '../schema';

import * as normalizeCreateNodesModule from './../normalize-create-nodes-options';
import * as environmentTargetsModule from './environment.targets';
import * as packageTargetsModule from './package.targets';

import * as nxDevkitModule from '@nx/devkit';

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

  vi.mock('@nx/devkit', ()   => {
    return {
      logger: {
        warn: vi.fn()
      }
    }
  })

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
    isEnvProjectSpy.mockRestore();
    isPkgSpy.mockRestore();
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

  it('should return empty object if !isE2eProject and !isPublishableProject', (): void => {
    isEnvProjectSpy.mockReturnValue(false);
    isPkgSpy.mockReturnValue(false);
    const projectConfiguration = createProjectConfiguration(config, options);
    expect(projectConfiguration).toStrictEqual({})
  });


  it('should log warn if isE2eProject and !projectConfiguration.implicitDependencies?.length', (): void => {
    createProjectConfiguration(config, options);
    expect(nxDevkitModule.logger.warn).toHaveBeenCalledOnce();
  });

  it('should not log warn if isE2eProject and projectConfiguration.implicitDependencies?.length', (): void => {
    const configWithImplicitDependencies = {...config, implicitDependencies: ['mock-implicit-dep']}
    createProjectConfiguration(configWithImplicitDependencies, options);
    expect(nxDevkitModule.logger.warn).toHaveBeenCalledTimes(0);
  });

  it('should not log warn if !isE2eProject and projectConfiguration.implicitDependencies?.length', (): void => {
    isEnvProjectSpy.mockReturnValue(false);
    const configWithImplicitDependencies = {...config, implicitDependencies: ['mock-implicit-dep']}
    createProjectConfiguration(configWithImplicitDependencies, options);
    expect(nxDevkitModule.logger.warn).toHaveBeenCalledTimes(0);
  });

  it('should not log warn if !isE2eProject and !projectConfiguration.implicitDependencies?.length', (): void => {
    isEnvProjectSpy.mockReturnValue(false);
    createProjectConfiguration(config, options);
    expect(nxDevkitModule.logger.warn).toHaveBeenCalledTimes(0);
  });



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
