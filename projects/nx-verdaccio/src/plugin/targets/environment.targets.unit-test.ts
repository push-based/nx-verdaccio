import {
  afterEach,
  beforeEach,
  describe,
  expect,
  Mock,
  MockInstance,
} from 'vitest';
import { ProjectConfiguration, TargetConfiguration } from '@nx/devkit';
import {
  TARGET_ENVIRONMENT_VERDACCIO_START,
  TARGET_ENVIRONMENT_VERDACCIO_STOP,
  VERDACCIO_STORAGE_DIR,
  isEnvProject,
  verdaccioTargets,
  getEnvTargets,
  TARGET_ENVIRONMENT_BOOTSTRAP,
  TARGET_ENVIRONMENT_INSTALL,
  TARGET_ENVIRONMENT_PUBLISH_ONLY,
  TARGET_ENVIRONMENT_SETUP,
  TARGET_ENVIRONMENT_TEARDOWN,
  TARGET_ENVIRONMENT_E2E, updateEnvTargetNames
} from './environment.targets';
import { NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';
import { PACKAGE_NAME } from '../constants';
import { EXECUTOR_ENVIRONMENT_KILL_PROCESS } from '../../executors/kill-process/constant';
import {
  EXECUTOR_ENVIRONMENT_BOOTSTRAP,
  VERDACCIO_REGISTRY_JSON,
} from '../../executors/env-bootstrap/constants';

import * as nodePathModule from 'node:path';
import * as uniquePortModule from '../../executors/env-bootstrap/unique-port';
import { EXECUTOR_ENVIRONMENT_TEARDOWN } from '../../executors/env-teardown/constants';
import {
  TARGET_PACKAGE_INSTALL,
  TARGET_PACKAGE_PUBLISH,
} from './package.targets';
import { EXECUTOR_ENVIRONMENT_SETUP } from '../../executors/env-setup/constants';

describe('isEnvProject', (): void => {
  const projectConfig: ProjectConfiguration = {
    root: '',
    tags: ['env:production', 'type:library'],
    targets: {
      build: {},
      test: {},
    },
  };
  const normalizedOptions: NormalizedCreateNodeOptions['environments'] = {
    environmentsDir: '',
    targetNames: ['cola', 'mock', 'build'],
    filterByTags: ['env:production'],
  };

  it('should returns false if targets missing', () => {
    const config = { ...projectConfig, targets: null };
    const result = isEnvProject(config, normalizedOptions);
    expect(result).toBe(false);
  });

  it('should returns false if targetNames missing', () => {
    const options = { ...normalizedOptions, targetNames: null };
    const result = isEnvProject(projectConfig, options);
    expect(result).toBe(false);
  });

  it('should returns false if targetNames and targets missing', () => {
    const config = { ...projectConfig, targets: null };
    const result = isEnvProject(config, normalizedOptions);
    expect(result).toBe(false);
  });

  it('should returns false if targetNames don’t match environmentTargetNames', () => {
    const options = { ...normalizedOptions, targetNames: ['mockTarget'] };
    const result = isEnvProject(projectConfig, options);
    expect(result).toBe(false);
  });

  it('should returns true if targetNames match and no tags', () => {
    const config = { ...projectConfig, tags: null };
    const result = isEnvProject(config, normalizedOptions);
    expect(result).toBe(true);
  });

  it('should returns true if targetNames match and no filterByTags', () => {
    const options = {
      ...normalizedOptions,
      filterByTags: null,
    };
    const result = isEnvProject(projectConfig, options);
    expect(result).toBe(true);
  });

  it('should returns true if targetNames match and tags match filterByTags', () => {
    const result = isEnvProject(projectConfig, normalizedOptions);
    expect(result).toBe(true);
  });

  it('should returns false if targetNames match but tags don’t match filterByTags', () => {
    const options = {
      ...normalizedOptions,
      filterByTags: ['mock-tag-no-match'],
    };
    const result = isEnvProject(projectConfig, options);
    expect(result).toBe(false);
  });
});

describe('verdaccioTargets', (): void => {
  const port = 1337;
  const environmentsDir = 'environments';
  const projectName = 'test-project';
  const joinResult = 'mocked-join';
  const customOption = 'custom-value';
  const projectConfig = { name: projectName, root: 'test' };
  const options = {
    environmentsDir,
    customOption,
  };

  let uniquePortSpy: MockInstance<[], number>;

  vi.mock('node:path', (): { join: Mock } => {
    return {
      join: vi.fn().mockReturnValue('mocked-join'),
    };
  });

  beforeEach((): void => {
    uniquePortSpy = vi
      .spyOn(uniquePortModule, 'uniquePort')
      .mockReturnValue(port);
  });
  afterEach((): void => {
    vi.clearAllMocks();
    uniquePortSpy.mockRestore();
  });

  it('should generate object with correct start&end targets', (): void => {
    const result: Record<string, TargetConfiguration> = verdaccioTargets(
      projectConfig,
      options
    );

    expect(result).toEqual({
      [TARGET_ENVIRONMENT_VERDACCIO_START]: {
        outputs: [`{options.environmentRoot}/${VERDACCIO_STORAGE_DIR}`],
        executor: '@nx/js:verdaccio',
        options: {
          config: '.verdaccio/config.yml',
          port: port,
          storage: joinResult,
          clear: true,
          environmentDir: joinResult,
          projectName: projectName,
          customOption: customOption,
        },
      },
      [TARGET_ENVIRONMENT_VERDACCIO_STOP]: {
        executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_KILL_PROCESS}`,
        options: {
          filePath: joinResult,
          customOption: customOption,
        },
      },
    });
  });

  it('should call join 3 times with correct arguments', (): void => {
    verdaccioTargets(projectConfig, options);

    expect(nodePathModule.join).toHaveBeenCalledTimes(3);
    expect(nodePathModule.join).toHaveBeenNthCalledWith(
      1,
      environmentsDir,
      projectName
    );
    expect(nodePathModule.join).toHaveBeenNthCalledWith(
      2,
      joinResult,
      VERDACCIO_STORAGE_DIR
    );
    expect(nodePathModule.join).toHaveBeenNthCalledWith(
      3,
      environmentsDir,
      VERDACCIO_REGISTRY_JSON
    );
  });

  it('should call uniquePort once', (): void => {
    verdaccioTargets(projectConfig, options);

    expect(uniquePortSpy).toHaveBeenCalledTimes(1);
  });
});

describe('getEnvTargets', (): void => {
  const projectConfig = { name: 'test-project', root: '' };
  const options = {
    environmentsDir: '/environments',
    targetNames: ['build', 'deploy'],
  };
  const joinResult = 'mocked-join';
  const environmentsDir = '/environments';
  const projectName = 'test-project';

  vi.mock('node:path', (): { join: Mock } => {
    return {
      join: vi.fn().mockReturnValue('mocked-join'),
    };
  });

  afterEach((): void => {
    vi.clearAllMocks();
  });

  it('should generate env targets with correct structure', (): void => {
    const targets = getEnvTargets(projectConfig, options);

    expect(targets).toMatchObject({
      [TARGET_ENVIRONMENT_BOOTSTRAP]: expect.any(Object),
      [TARGET_ENVIRONMENT_INSTALL]: expect.any(Object),
      [TARGET_ENVIRONMENT_PUBLISH_ONLY]: expect.any(Object),
      [TARGET_ENVIRONMENT_SETUP]: expect.any(Object),
      [TARGET_ENVIRONMENT_TEARDOWN]: expect.any(Object),
      [TARGET_ENVIRONMENT_E2E]: expect.any(Object),
    });
  });

  it('should generate env targets TARGET_ENVIRONMENT_BOOTSTRAP nested object with correct structure, and data', (): void => {
    const targets = getEnvTargets(projectConfig, options);

    expect(targets[TARGET_ENVIRONMENT_BOOTSTRAP]).toMatchObject({
      executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_BOOTSTRAP}`,
    });
  });

  it('should generate env targets TARGET_ENVIRONMENT_INSTALL nested object with correct structure, and data', (): void => {
    const targets = getEnvTargets(projectConfig, options);

    expect(targets[TARGET_ENVIRONMENT_INSTALL]).toMatchObject({
      dependsOn: [
        {
          projects: 'dependencies',
          target: TARGET_PACKAGE_INSTALL,
          params: 'forward',
        },
      ],
      options: { environmentRoot: joinResult },
      command: `echo "dependencies installed for ${joinResult}"`,
    });
  });

  it('should generate env targets TARGET_ENVIRONMENT_PUBLISH_ONLY nested object with correct structure, and data', (): void => {
    const targets = getEnvTargets(projectConfig, options);

    expect(targets[TARGET_ENVIRONMENT_PUBLISH_ONLY]).toMatchObject({
      dependsOn: [
        {
          projects: 'dependencies',
          target: TARGET_PACKAGE_PUBLISH,
          params: 'forward',
        },
      ],
      options: { environmentRoot: joinResult },
      command: `echo "dependencies published for ${joinResult}"`,
    });
  });

  it('should generate env targets TARGET_ENVIRONMENT_SETUP  nested object with correct structure, and data', (): void => {
    const targets = getEnvTargets(projectConfig, options);

    expect(targets[TARGET_ENVIRONMENT_SETUP]).toMatchObject({
      inputs: [
        '{projectRoot}/project.json',
        { runtime: 'node --version' },
        { runtime: 'npm --version' },
        { externalDependencies: ['verdaccio'] },
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
    });
  });

  it('should generate env targets TARGET_ENVIRONMENT_E2E nested object with correct structure, and data', (): void => {
    const targets = getEnvTargets(projectConfig, options);

    expect(targets[TARGET_ENVIRONMENT_INSTALL]).toMatchObject({
      dependsOn: [
        {
          projects: 'dependencies',
          target: TARGET_PACKAGE_INSTALL,
          params: 'forward',
        },
      ],
      options: { environmentRoot: joinResult },
      command: `echo "dependencies installed for ${joinResult}"`,
    });
  });

  it('should generate env targets TARGET_ENVIRONMENT_TEARDOWN nested object with correct structure, and data', (): void => {
    const targets = getEnvTargets(projectConfig, options);

    expect(targets[TARGET_ENVIRONMENT_TEARDOWN]).toMatchObject({
      executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_TEARDOWN}`,
    });
  });

  it('should call join once, with environmentsDir and envProject', (): void => {
    getEnvTargets(projectConfig, options);

    expect(nodePathModule.join).toHaveBeenCalledTimes(1);
    expect(nodePathModule.join).toBeCalledWith(environmentsDir, projectName);
  });
});

describe('updateEnvTargetNames', (): void => {
  const targets = {
    e2e: { executor: 'nx:test', options: {} },
    build: { executor: 'nx:build', options: {} },
  };
  const defaultProjectConfig = {
    targets,
    root: 'test'
  };
  const defaultOptions = {
    targetNames: ['e2e'],
  };

  it('should generate updated targets with target names as keys', (): void => {
    const updatedTargets = updateEnvTargetNames(defaultProjectConfig, defaultOptions);

    expect(updatedTargets).toMatchObject({
      build: expect.any(Object),
      e2e: expect.any(Object),
    });
  });

  it('should not add any additional target name from options to object structure', (): void => {
    const options = {
      targetNames: ['additional-target-0', 'e2e', 'build', 'additional-target', 'additional-target-2'],
    };

    const updatedTargets = updateEnvTargetNames(defaultProjectConfig, options);

    expect(updatedTargets).toMatchObject({
      build: expect.any(Object),
      e2e: expect.any(Object),
    });
  });

  it('should return empty object if is not targets in config', (): void => {
    const config = {
      ...defaultProjectConfig,
      targets: {}
    };

    const updatedTargets = updateEnvTargetNames(config, defaultOptions);

    expect(updatedTargets).toEqual({});
  });

  it('should add dependsOn if match with targetNames options', (): void => {
    const updatedTargets = updateEnvTargetNames(defaultProjectConfig, defaultOptions);
    expect(updatedTargets).toMatchObject(
      {
        ...targets,
        e2e: {
          ...targets.e2e,
          dependsOn: [
            { target: TARGET_ENVIRONMENT_SETUP, params: 'forward' },
          ],
        }
      }
    );
  });

  it('should add dependsOn to every matching target', (): void => {
    const options = {
      targetNames: ['e2e', 'build'],
    };
    const updatedTargets = updateEnvTargetNames(defaultProjectConfig, options);

    expect(updatedTargets).toMatchObject( {
      e2e: {
        ...targets.e2e,
        dependsOn: [
          { target: TARGET_ENVIRONMENT_SETUP, params: 'forward' },
        ],
      },
      build: {
        ...targets.build,
        dependsOn: [
          { target: TARGET_ENVIRONMENT_SETUP, params: 'forward' },
        ],
      }
    });
  });

  it('should keep existing dependsOn properties and add a new one', (): void => {
    const config = {
      ...defaultProjectConfig,
      targets: {
        ...defaultProjectConfig.targets,
        e2e: {
          ...defaultProjectConfig.targets.e2e,
          dependsOn: [{ target: 'existing-target' }],
        }
      }}

    const updatedTargets = updateEnvTargetNames(config, defaultOptions);

    expect(updatedTargets).toMatchObject({
      ...targets,
      e2e: {
        ...targets.e2e,
        dependsOn: [
          { target: TARGET_ENVIRONMENT_SETUP, params: 'forward' },
          { target: 'existing-target' },
        ],
      },
    });
  });

  it('should not update projectConfig targets if options targetNames are empty', (): void => {
    const options = {
      targetNames: []
    }
    const updatedTargets = updateEnvTargetNames(defaultProjectConfig, options);

    expect(updatedTargets).toEqual(defaultProjectConfig.targets);
  });

  it('should not update projectConfig targets if none options targetNames match', (): void => {
    const options = {
      targetNames: ['no-matching-target'],
    };
    const updatedTargets = updateEnvTargetNames(defaultProjectConfig, options);

    expect(updatedTargets).toEqual(defaultProjectConfig.targets);
  });
});
