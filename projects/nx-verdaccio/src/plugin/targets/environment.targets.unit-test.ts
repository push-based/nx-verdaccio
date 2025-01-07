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
  TARGET_ENVIRONMENT_E2E,
  updateEnvTargetNames,
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

const JOIN_RESULT = 'mocked-join';
const PROJECT_NAME = 'unit-test-project';
const TARGET_NAMES = ['e2e'];
const TAGS = ['env:production'];
const TARGETS = {
  e2e: { executor: 'nx:test', options: {} },
  build: { executor: 'nx:build', options: {} },
};
const ENVIRONMENTS_DIRECTORY = '/environments'
const PROJECT_CONFIG: ProjectConfiguration = {
  root: 'mock-root',
  name: PROJECT_NAME,
  targets: TARGETS,
  tags: [...TAGS, 'type:library']
};
const OPTIONS: NormalizedCreateNodeOptions['environments'] = {
  environmentsDir: ENVIRONMENTS_DIRECTORY,
  targetNames: TARGET_NAMES,
  filterByTags: TAGS,
};

describe('isEnvProject', (): void => {
  it('should returns false if targets missing', () => {
    const config = { ...PROJECT_CONFIG, targets: null };
    const result = isEnvProject(config, OPTIONS);
    expect(result).toBe(false);
  });

  it('should returns false if targetNames missing', () => {
    const options = { ...OPTIONS, targetNames: null };
    const result = isEnvProject(PROJECT_CONFIG, options);
    expect(result).toBe(false);
  });

  it('should returns false if targetNames and targets missing', () => {
    const config = { ...PROJECT_CONFIG, targets: null };
    const result = isEnvProject(config, OPTIONS);
    expect(result).toBe(false);
  });

  it('should returns false if targetNames don’t match environmentTargetNames', () => {
    const options = { ...OPTIONS, targetNames: ['mockTarget'] };
    const result = isEnvProject(PROJECT_CONFIG, options);
    expect(result).toBe(false);
  });

  it('should returns true if targetNames match and no tags', () => {
    const config = { ...PROJECT_CONFIG, tags: null };
    const result = isEnvProject(config, OPTIONS);
    expect(result).toBe(true);
  });

  it('should returns true if targetNames match and no filterByTags', () => {
    const options = {
      ...OPTIONS,
      filterByTags: null,
    };
    const result = isEnvProject(PROJECT_CONFIG, options);
    expect(result).toBe(true);
  });

  it('should returns true if targetNames match and tags match filterByTags', () => {
    const result = isEnvProject(PROJECT_CONFIG, OPTIONS);
    expect(result).toBe(true);
  });

  it('should returns false if targetNames match but tags don’t match filterByTags', () => {
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
    const customOption = 'custom-value';
    const options = {...OPTIONS, customOption};

    const result: Record<string, TargetConfiguration> = verdaccioTargets(
      PROJECT_CONFIG,
      options
    );

    expect(result).toEqual({
      [TARGET_ENVIRONMENT_VERDACCIO_START]: {
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
          targetNames:  TARGET_NAMES,
        },
      },
      [TARGET_ENVIRONMENT_VERDACCIO_STOP]: {
        executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_KILL_PROCESS}`,
        options: {
          filePath: JOIN_RESULT,
          customOption: customOption,
          filterByTags: TAGS,
          targetNames:  TARGET_NAMES,
        },
      },
    });
  });

  it('should call join 3 times with correct arguments', (): void => {
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

  it('should generate env targets TARGET_ENVIRONMENT_BOOTSTRAP nested object with correct structure, and data', (): void => {
    const targets = getEnvTargets(PROJECT_CONFIG, OPTIONS);

    expect(targets[TARGET_ENVIRONMENT_BOOTSTRAP]).toMatchObject({
      executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_BOOTSTRAP}`,
    });
  });

  it('should generate env targets TARGET_ENVIRONMENT_INSTALL nested object with correct structure, and data', (): void => {
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

  it('should generate env targets TARGET_ENVIRONMENT_PUBLISH_ONLY nested object with correct structure, and data', (): void => {
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

  it('should generate env targets TARGET_ENVIRONMENT_SETUP  nested object with correct structure, and data', (): void => {
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

  it('should generate env targets TARGET_ENVIRONMENT_E2E nested object with correct structure, and data', (): void => {
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

  it('should generate env targets TARGET_ENVIRONMENT_TEARDOWN nested object with correct structure, and data', (): void => {
    const targets = getEnvTargets(PROJECT_CONFIG, OPTIONS);

    expect(targets[TARGET_ENVIRONMENT_TEARDOWN]).toMatchObject({
      executor: `${PACKAGE_NAME}:${EXECUTOR_ENVIRONMENT_TEARDOWN}`,
    });
  });

  it('should call join once, with environmentsDir and envProject', (): void => {
    getEnvTargets(PROJECT_CONFIG, OPTIONS);

    expect(nodePathModule.join).toHaveBeenCalledTimes(1);
    expect(nodePathModule.join).toBeCalledWith(ENVIRONMENTS_DIRECTORY, PROJECT_NAME);
  });
});

describe('updateEnvTargetNames', (): void => {
  it('should generate updated targets with target names as keys', (): void => {
    const updatedTargets = updateEnvTargetNames(
      PROJECT_CONFIG,
      OPTIONS
    );

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

  it('should return empty object if is not targets in config', (): void => {
    const config = {
      ...PROJECT_CONFIG,
      targets: {},
    };

    const updatedTargets = updateEnvTargetNames(config, OPTIONS);

    expect(updatedTargets).toEqual({});
  });

  it('should add dependsOn if match with targetNames options', (): void => {
    const updatedTargets = updateEnvTargetNames(
      PROJECT_CONFIG,
      OPTIONS
    );
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

  it('should not update projectConfig targets if none options targetNames match', (): void => {
    const options = {
      targetNames: ['no-matching-target'],
    };
    const updatedTargets = updateEnvTargetNames(PROJECT_CONFIG, options);

    expect(updatedTargets).toEqual(PROJECT_CONFIG.targets);
  });
});
