import {
  afterEach,
  beforeEach,
  describe,
  expect,
  type Mock,
  type MockInstance,
} from 'vitest';
import {
  type ProjectConfiguration,
  type TargetConfiguration,
} from '@nx/devkit';

import {
  isEnvProject,
  verdaccioTargets,
  getEnvTargets,
  updateEnvTargetNames,
  VERDACCIO_STORAGE_DIR,
  TARGET_ENVIRONMENT_VERDACCIO_START,
  TARGET_ENVIRONMENT_VERDACCIO_STOP,
  TARGET_ENVIRONMENT_BOOTSTRAP,
  TARGET_ENVIRONMENT_INSTALL,
  TARGET_ENVIRONMENT_PUBLISH_ONLY,
  TARGET_ENVIRONMENT_SETUP,
  TARGET_ENVIRONMENT_TEARDOWN,
  TARGET_ENVIRONMENT_E2E,
} from './environment.targets';
import {
  TARGET_PACKAGE_INSTALL,
  TARGET_PACKAGE_PUBLISH,
} from './package.targets';

import { PACKAGE_NAME } from '../constants';
import { type NormalizedCreateNodeOptions } from '../normalize-create-nodes-options';

import { EXECUTOR_ENVIRONMENT_KILL_PROCESS } from '../../executors/kill-process/constant';
import {
  EXECUTOR_ENVIRONMENT_BOOTSTRAP,
  VERDACCIO_REGISTRY_JSON,
} from '../../executors/env-bootstrap/constants';
import { EXECUTOR_ENVIRONMENT_TEARDOWN } from '../../executors/env-teardown/constants';
import { EXECUTOR_ENVIRONMENT_SETUP } from '../../executors/env-setup/constants';

import * as nodePathModule from 'node:path';
import * as uniquePortModule from '../../executors/env-bootstrap/unique-port';

const JOIN_RESULT = 'mocked-join';
const PROJECT_NAME = 'unit-test-project';
const ENVIRONMENTS_DIRECTORY = '/environments';
const TARGET_NAMES = ['e2e'];
const TAGS = ['env:production'];
const TARGETS: { [targetName: string]: TargetConfiguration } = {
  e2e: { executor: 'nx:test', options: {} },
  build: { executor: 'nx:build', options: {} },
};
const PROJECT_CONFIG: ProjectConfiguration = {
  root: 'mock-root',
  name: PROJECT_NAME,
  targets: TARGETS,
  tags: [...TAGS],
};
const OPTIONS: NormalizedCreateNodeOptions['environments'] = {
  environmentsDir: ENVIRONMENTS_DIRECTORY,
  targetNames: TARGET_NAMES,
  filterByTags: TAGS,
};

describe('isEnvProject', (): void => {
  it('should return false if targets are missing', (): void => {
    const config = { ...PROJECT_CONFIG, targets: null };
    const result = isEnvProject(config, OPTIONS);
    expect(result).toBe(false);
  });

  it('should return false if targetNames are missing', (): void => {
    const options = { ...OPTIONS, targetNames: null };
    const result = isEnvProject(PROJECT_CONFIG, options);
    expect(result).toBe(false);
  });

  it('should return false if targetNames and targets are missing', (): void => {
    const config = { ...PROJECT_CONFIG, targets: null };
    const options = { ...OPTIONS, targetNames: null };
    const result = isEnvProject(config, options);
    expect(result).toBe(false);
  });

  it('should return false if targetNames don’t match environmentTargetNames', (): void => {
    const options = { ...OPTIONS, targetNames: ['mockTarget'] };
    const result = isEnvProject(PROJECT_CONFIG, options);
    expect(result).toBe(false);
  });

  it('should return true if targetNames match and tags are not present', (): void => {
    const config = { ...PROJECT_CONFIG, tags: null };
    const result = isEnvProject(config, OPTIONS);
    expect(result).toBe(true);
  });

  it('should return true if targetNames match and filterByTags are not present', (): void => {
    const options = {
      ...OPTIONS,
      filterByTags: null,
    };
    const result = isEnvProject(PROJECT_CONFIG, options);
    expect(result).toBe(true);
  });

  it('should return true if targetNames match and tags match filterByTags', (): void => {
    const result = isEnvProject(PROJECT_CONFIG, OPTIONS);
    expect(result).toBe(true);
  });

  it('should return false if targetNames match but tags don’t match filterByTags', (): void => {
    const options = {
      ...OPTIONS,
      filterByTags: ['mock-tag-no-match'],
    };
    const result = isEnvProject(PROJECT_CONFIG, options);
    expect(result).toBe(false);
  });
});

describe('verdaccioTargets', (): void => {
  const port = 1337;
  const customOption = 'custom-value';
  const options = { ...OPTIONS, customOption }

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

  it('should generate verdaccio targets with correct structure', (): void => {
    const result: Record<string, TargetConfiguration> = verdaccioTargets(
      PROJECT_CONFIG,
      options
    );

    expect(result).toMatchObject({
      [TARGET_ENVIRONMENT_VERDACCIO_START]: expect.any(Object),
      [TARGET_ENVIRONMENT_VERDACCIO_STOP]: expect.any(Object),
    });
  });

  it('should generate verdaccio targets TARGET_ENVIRONMENT_VERDACCIO_START nested object with correct data ', (): void => {
    const result: Record<string, TargetConfiguration> = verdaccioTargets(
      PROJECT_CONFIG,
      options
    );

    expect(result[TARGET_ENVIRONMENT_VERDACCIO_START]).toEqual({
      outputs: [`{options.environmentRoot}/${VERDACCIO_STORAGE_DIR}`],
      executor: '@nx/js:verdaccio',
      options: {
        config: '.verdaccio/config.yml',
        port: port,
        storage: JOIN_RESULT,
        clear: true,
        environmentDir: JOIN_RESULT,
        projectName: PROJECT_NAME,
        customOption: customOption,
        filterByTags: TAGS,
        targetNames: TARGET_NAMES,
      },
    });
  })

  it('should generate verdaccio targets TARGET_ENVIRONMENT_VERDACCIO_START nested object with correct data ', (): void => {
    const result: Record<string, TargetConfiguration> = verdaccioTargets(
      PROJECT_CONFIG,
      options
    );

    expect(result[TARGET_ENVIRONMENT_VERDACCIO_STOP]).toEqual({
        executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_KILL_PROCESS}`,
        options: {
          filePath: JOIN_RESULT,
          customOption: customOption,
          filterByTags: TAGS,
          targetNames: TARGET_NAMES,
        },
    });
  });

  it('should call join 3 times in correct order with correct arguments', (): void => {
    verdaccioTargets(PROJECT_CONFIG, OPTIONS);

    expect(nodePathModule.join).toHaveBeenCalledTimes(3);
    expect(nodePathModule.join).toHaveBeenNthCalledWith(
      1,
      ENVIRONMENTS_DIRECTORY,
      PROJECT_NAME
    );
    expect(nodePathModule.join).toHaveBeenNthCalledWith(
      2,
      JOIN_RESULT,
      VERDACCIO_STORAGE_DIR
    );
    expect(nodePathModule.join).toHaveBeenNthCalledWith(
      3,
      ENVIRONMENTS_DIRECTORY,
      VERDACCIO_REGISTRY_JSON
    );
  });

  it('should call uniquePort once', (): void => {
    verdaccioTargets(PROJECT_CONFIG, OPTIONS);

    expect(uniquePortSpy).toHaveBeenCalledTimes(1);
  });
});

describe('getEnvTargets', (): void => {
  vi.mock('node:path', (): { join: Mock } => {
    return {
      join: vi.fn().mockReturnValue('mocked-join'),
    };
  });

  afterEach((): void => {
    vi.clearAllMocks();
  });

  it('should generate env targets with correct structure', (): void => {
    const targets = getEnvTargets(PROJECT_CONFIG, OPTIONS);

    expect(targets).toMatchObject({
      [TARGET_ENVIRONMENT_BOOTSTRAP]: expect.any(Object),
      [TARGET_ENVIRONMENT_INSTALL]: expect.any(Object),
      [TARGET_ENVIRONMENT_PUBLISH_ONLY]: expect.any(Object),
      [TARGET_ENVIRONMENT_SETUP]: expect.any(Object),
      [TARGET_ENVIRONMENT_TEARDOWN]: expect.any(Object),
      [TARGET_ENVIRONMENT_E2E]: expect.any(Object),
    });
  });

  it('should generate env targets TARGET_ENVIRONMENT_BOOTSTRAP nested object with correct structure and data', (): void => {
    const targets = getEnvTargets(PROJECT_CONFIG, OPTIONS);

    expect(targets[TARGET_ENVIRONMENT_BOOTSTRAP]).toMatchObject({
      executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_BOOTSTRAP}`,
    });
  });

  it('should generate env targets TARGET_ENVIRONMENT_INSTALL nested object with correct structure and data', (): void => {
    const targets = getEnvTargets(PROJECT_CONFIG, OPTIONS);

    expect(targets[TARGET_ENVIRONMENT_INSTALL]).toMatchObject({
      dependsOn: [
        {
          projects: 'dependencies',
          target: TARGET_PACKAGE_INSTALL,
          params: 'forward',
        },
      ],
      options: { environmentRoot: JOIN_RESULT },
      command: `echo "dependencies installed for ${JOIN_RESULT}"`,
    });
  });

  it('should generate env targets TARGET_ENVIRONMENT_PUBLISH_ONLY nested object with correct structure and data', (): void => {
    const targets = getEnvTargets(PROJECT_CONFIG, OPTIONS);

    expect(targets[TARGET_ENVIRONMENT_PUBLISH_ONLY]).toMatchObject({
      dependsOn: [
        {
          projects: 'dependencies',
          target: TARGET_PACKAGE_PUBLISH,
          params: 'forward',
        },
      ],
      options: { environmentRoot: JOIN_RESULT },
      command: `echo "dependencies published for ${JOIN_RESULT}"`,
    });
  });

  it('should generate env targets TARGET_ENVIRONMENT_SETUP  nested object with correct structure and data', (): void => {
    const targets = getEnvTargets(PROJECT_CONFIG, OPTIONS);

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

  it('should generate env targets TARGET_ENVIRONMENT_E2E nested object with correct structure and data', (): void => {
    const targets = getEnvTargets(PROJECT_CONFIG, OPTIONS);

    expect(targets[TARGET_ENVIRONMENT_INSTALL]).toMatchObject({
      dependsOn: [
        {
          projects: 'dependencies',
          target: TARGET_PACKAGE_INSTALL,
          params: 'forward',
        },
      ],
      options: { environmentRoot: JOIN_RESULT },
      command: `echo "dependencies installed for ${JOIN_RESULT}"`,
    });
  });

  it('should generate env targets TARGET_ENVIRONMENT_TEARDOWN nested object with correct structure and data', (): void => {
    const targets = getEnvTargets(PROJECT_CONFIG, OPTIONS);

    expect(targets[TARGET_ENVIRONMENT_TEARDOWN]).toMatchObject({
      executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_TEARDOWN}`,
    });
  });

  it('should call join once, with environmentsDir and envProject', (): void => {
    getEnvTargets(PROJECT_CONFIG, OPTIONS);

    expect(nodePathModule.join).toHaveBeenCalledTimes(1);
    expect(nodePathModule.join).toBeCalledWith(
      ENVIRONMENTS_DIRECTORY,
      PROJECT_NAME
    );
  });
});



describe('updateEnvTargetNames', (): void => {
  it('should generate updated targets with target names as keys', (): void => {
    const updatedTargets = updateEnvTargetNames(PROJECT_CONFIG, OPTIONS);

    expect(updatedTargets).toMatchObject({
      build: expect.any(Object),
      e2e: expect.any(Object),
    });
  });

  it('should not add any additional target name from options to object structure', (): void => {
    const options = {
      targetNames: [
        'additional-target-0',
        'e2e',
        'build',
        'additional-target',
        'additional-target-2',
      ],
    };

    const updatedTargets = updateEnvTargetNames(PROJECT_CONFIG, options);

    expect(updatedTargets).toMatchObject({
      build: expect.any(Object),
      e2e: expect.any(Object),
    });
  });

  it('should return empty object if there is no targets in config', (): void => {
    const config = {
      ...PROJECT_CONFIG,
      targets: {},
    };

    const updatedTargets = updateEnvTargetNames(config, OPTIONS);

    expect(updatedTargets).toEqual({});
  });

  it('should add dependsOn if there is a match with targetNames options', (): void => {
    const updatedTargets = updateEnvTargetNames(PROJECT_CONFIG, OPTIONS);
    expect(updatedTargets).toMatchObject({
      ...TARGETS,
      e2e: {
        ...TARGETS.e2e,
        dependsOn: [{ target: TARGET_ENVIRONMENT_SETUP, params: 'forward' }],
      },
    });
  });

  it('should add dependsOn to every matching target', (): void => {
    const options = {
      targetNames: ['e2e', 'build'],
    };
    const updatedTargets = updateEnvTargetNames(PROJECT_CONFIG, options);

    expect(updatedTargets).toMatchObject({
      e2e: {
        ...TARGETS.e2e,
        dependsOn: [{ target: TARGET_ENVIRONMENT_SETUP, params: 'forward' }],
      },
      build: {
        ...TARGETS.build,
        dependsOn: [{ target: TARGET_ENVIRONMENT_SETUP, params: 'forward' }],
      },
    });
  });

  it('should keep existing dependsOn properties and add a new one', (): void => {
    const config = {
      ...PROJECT_CONFIG,
      targets: {
        ...PROJECT_CONFIG.targets,
        e2e: {
          ...PROJECT_CONFIG.targets.e2e,
          dependsOn: [{ target: 'existing-target' }],
        },
      },
    };

    const updatedTargets = updateEnvTargetNames(config, OPTIONS);

    expect(updatedTargets).toMatchObject({
      ...TARGETS,
      e2e: {
        ...TARGETS.e2e,
        dependsOn: [
          { target: TARGET_ENVIRONMENT_SETUP, params: 'forward' },
          { target: 'existing-target' },
        ],
      },
    });
  });

  it('should not update projectConfig targets if options targetNames are empty', (): void => {
    const options = {
      targetNames: [],
    };
    const updatedTargets = updateEnvTargetNames(PROJECT_CONFIG, options);

    expect(updatedTargets).toEqual(PROJECT_CONFIG.targets);
  });

  it('should not update projectConfig targets if none of options targetNames have a match', (): void => {
    const options = {
      targetNames: ['no-matching-target'],
    };
    const updatedTargets = updateEnvTargetNames(PROJECT_CONFIG, options);

    expect(updatedTargets).toEqual(PROJECT_CONFIG.targets);
  });
});
