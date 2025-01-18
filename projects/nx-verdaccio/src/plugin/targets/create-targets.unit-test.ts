import { beforeEach, describe, expect, type MockInstance } from 'vitest';
import { type ProjectConfiguration } from '@nx/devkit';

import * as nxDevkitMockModule from '@nx/devkit';

import { createProjectConfiguration } from './create-targets';
import {
  TARGET_PACKAGE_INSTALL,
  TARGET_PACKAGE_PUBLISH,
} from './package.targets';
import {
  TARGET_ENVIRONMENT_E2E,
  TARGET_ENVIRONMENT_SETUP,
  TARGET_ENVIRONMENT_INSTALL,
  TARGET_ENVIRONMENT_TEARDOWN,
  TARGET_ENVIRONMENT_BOOTSTRAP,
  TARGET_ENVIRONMENT_PUBLISH_ONLY,
  TARGET_ENVIRONMENT_VERDACCIO_STOP,
  TARGET_ENVIRONMENT_VERDACCIO_START,
} from './environment.targets';

import { type NxVerdaccioCreateNodeOptions } from '../schema';
import { type NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';

import * as packageTargetsSpyModule from './package.targets';
import * as environmentTargetsModule from './environment.targets';
import * as normalizeCreateNodesSpyModule from './../normalize-create-nodes-options';

describe('createProjectConfiguration', (): void => {
  const implicitDependencies = ['mock-implicit-dep'];
  const projectConfiguration: ProjectConfiguration = {
    root: 'mock-root',
    name: 'unit-test-project',
    targets: { build: {} },
  };
  const options: NxVerdaccioCreateNodeOptions = {
    environments: {
      targetNames: ['build'],
    },
  };
  const normalizedOptions: NormalizedCreateNodeOptions = {
    environments: {
      targetNames: ['build'],
      environmentsDir: './environments',
    },
    packages: {
      targetNames: ['test', 'lint'],
      environmentsDir: './packages',
    },
  };

  vi.mock('@nx/devkit', () => {
    return {
      logger: {
        warn: vi.fn(),
      },
    };
  });

  let normalizeCreateNodesOptionsSpy: MockInstance;
  let isEnvProjectSpy: MockInstance;
  let isPkgSpy: MockInstance;
  let verdaccioTargetsSpy: MockInstance;
  let getEnvTargetsSpy: MockInstance;
  let updateEnvTargetNamesSpy: MockInstance;

  beforeEach((): void => {
    normalizeCreateNodesOptionsSpy = vi
      .spyOn(normalizeCreateNodesSpyModule, 'normalizeCreateNodesOptions')
      .mockReturnValue(normalizedOptions);
    isEnvProjectSpy = vi
      .spyOn(environmentTargetsModule, 'isEnvProject')
      .mockReturnValue(true);
    isPkgSpy = vi
      .spyOn(packageTargetsSpyModule, 'isPkgProject')
      .mockReturnValue(true);
    verdaccioTargetsSpy = vi.spyOn(
      environmentTargetsModule,
      'verdaccioTargets'
    );
    getEnvTargetsSpy = vi.spyOn(environmentTargetsModule, 'getEnvTargets');
    updateEnvTargetNamesSpy = vi.spyOn(
      environmentTargetsModule,
      'updateEnvTargetNames'
    );
  });

  afterEach((): void => {
    normalizeCreateNodesOptionsSpy.mockRestore();
    isEnvProjectSpy.mockRestore();
    isPkgSpy.mockRestore();
    verdaccioTargetsSpy.mockRestore();
    getEnvTargetsSpy.mockRestore();
    updateEnvTargetNamesSpy.mockRestore();
  });

  it('should call normalizeCreateNodesOptions ones with projectConfiguration and options', (): void => {
    createProjectConfiguration(projectConfiguration, options);
    expect(
      normalizeCreateNodesSpyModule.normalizeCreateNodesOptions
    ).toHaveBeenCalledOnce();
    expect(
      normalizeCreateNodesSpyModule.normalizeCreateNodesOptions
    ).toHaveBeenCalledWith(options);
  });

  it('should call isEnvProject ones with projectConfiguration and environments', (): void => {
    createProjectConfiguration(projectConfiguration, options);
    expect(environmentTargetsModule.isEnvProject).toHaveBeenCalledOnce();
    expect(environmentTargetsModule.isEnvProject).toHaveBeenCalledWith(
      projectConfiguration,
      normalizedOptions['environments']
    );
  });

  it('should call isPublishableProject ones with projectConfiguration and packages', (): void => {
    createProjectConfiguration(projectConfiguration, options);
    expect(packageTargetsSpyModule.isPkgProject).toHaveBeenCalledOnce();
    expect(packageTargetsSpyModule.isPkgProject).toHaveBeenCalledWith(
      projectConfiguration,
      normalizedOptions['packages']
    );
  });

  it('should return empty object if isE2eProject and isPublishableProject are false', (): void => {
    isEnvProjectSpy.mockReturnValue(false);
    isPkgSpy.mockReturnValue(false);
    const result = createProjectConfiguration(projectConfiguration, options);
    expect(result).toStrictEqual({});
  });

  it('should log warn if isE2eProject is true and implicitDependencies are empty', (): void => {
    createProjectConfiguration(projectConfiguration, options);
    expect(nxDevkitMockModule.logger.warn).toHaveBeenCalledOnce();
  });

  it('should not log warn if isE2eProject is true and implicitDependencies are given', (): void => {
    const configWithImplicitDependencies = {
      ...projectConfiguration,
      implicitDependencies,
    };
    createProjectConfiguration(configWithImplicitDependencies, options);
    expect(nxDevkitMockModule.logger.warn).toHaveBeenCalledTimes(0);
  });

  it('should not log warn if isE2eProject is false and implicitDependencies are given', (): void => {
    isEnvProjectSpy.mockReturnValue(false);
    const configWithImplicitDependencies = {
      ...projectConfiguration,
      implicitDependencies,
    };
    createProjectConfiguration(configWithImplicitDependencies, options);
    expect(nxDevkitMockModule.logger.warn).toHaveBeenCalledTimes(0);
  });

  it('should not log warn if isE2eProject is false and implicitDependencies are not given', (): void => {
    isEnvProjectSpy.mockReturnValue(false);
    createProjectConfiguration(projectConfiguration, options);
    expect(nxDevkitMockModule.logger.warn).toHaveBeenCalledTimes(0);
  });

  it('should generate project configuration with namedInputs and targets if isE2eProject and isPublishableProject are true', (): void => {
    const result = createProjectConfiguration(projectConfiguration, options);
    expect(result).toMatchObject({
      namedInputs: expect.any(Object),
      targets: expect.any(Object),
    });
  });

  it('should generate project configuration with targets if isE2eProject is false and isPublishableProject', (): void => {
    const result = createProjectConfiguration(projectConfiguration, options);
    expect(result).toMatchObject({
      targets: expect.any(Object),
    });
  });

  it('should generate configuration with correct structure if isE2eProject is false and isPublishableProject is true', (): void => {
    const result = createProjectConfiguration(projectConfiguration, options);
    expect(result).toMatchObject({
      namedInputs: expect.any(Object),
      targets: expect.any(Object),
    });
  });

  it('should generate configuration with correct structure if isE2eProject is true and isPublishableProject is false', (): void => {
    isPkgSpy.mockReturnValue(false);
    const result = createProjectConfiguration(projectConfiguration, options);
    expect(result).toMatchObject({
      namedInputs: expect.any(Object),
      targets: expect.any(Object),
    });
  });

  it('should generate targets with correct structure if isE2eProject is true and isPublishableProject is false', (): void => {
    isPkgSpy.mockReturnValue(false);
    const result = createProjectConfiguration(projectConfiguration, options);
    expect(result['targets']).toMatchObject({
      build: expect.any(Object),
      [TARGET_ENVIRONMENT_VERDACCIO_START]: expect.any(Object),
      [TARGET_ENVIRONMENT_VERDACCIO_STOP]: expect.any(Object),
      [TARGET_ENVIRONMENT_BOOTSTRAP]: expect.any(Object),
      [TARGET_ENVIRONMENT_INSTALL]: expect.any(Object),
      [TARGET_ENVIRONMENT_PUBLISH_ONLY]: expect.any(Object),
      [TARGET_ENVIRONMENT_SETUP]: expect.any(Object),
      [TARGET_ENVIRONMENT_TEARDOWN]: expect.any(Object),
      [TARGET_ENVIRONMENT_E2E]: expect.any(Object),
    });
  });

  it('should generate targets with correct structure if isE2eProject is false and isPublishableProject is true', (): void => {
    const result = createProjectConfiguration(projectConfiguration, options);
    expect(result['targets']).toMatchObject({
      [TARGET_PACKAGE_PUBLISH]: expect.any(Object),
      [TARGET_PACKAGE_INSTALL]: expect.any(Object),
    });
  });

  it('should call verdaccioTargets ones with correct arguments', (): void => {
    createProjectConfiguration(projectConfiguration, options);
    expect(environmentTargetsModule.verdaccioTargets).toHaveBeenCalledOnce();
    expect(environmentTargetsModule.verdaccioTargets).toHaveBeenCalledWith(
      projectConfiguration,
      { environmentsDir: normalizedOptions.environments.environmentsDir }
    );
  });

  it('should call getEnvTargets ones with correct arguments', (): void => {
    createProjectConfiguration(projectConfiguration, options);
    expect(environmentTargetsModule.getEnvTargets).toHaveBeenCalledOnce();
    expect(environmentTargetsModule.getEnvTargets).toHaveBeenCalledWith(
      projectConfiguration,
      normalizedOptions.environments
    );
  });

  it('should call updateEnvTargetNames ones with correct arguments', (): void => {
    createProjectConfiguration(projectConfiguration, options);
    expect(
      environmentTargetsModule.updateEnvTargetNames
    ).toHaveBeenCalledOnce();
    expect(environmentTargetsModule.updateEnvTargetNames).toHaveBeenCalledWith(
      projectConfiguration,
      normalizedOptions.environments
    );
  });
});
