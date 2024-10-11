import type { Tree } from '@nx/devkit';
import { join } from 'node:path';
import { afterEach, expect } from 'vitest';
import {
  addJsLibToWorkspace,
  materializeTree,
  nxShowProjectJson,
  registerPluginInWorkspace,
} from '@push-based/test-nx-utils';
import { updateProjectConfiguration } from 'nx/src/generators/utils/project-configuration';
import {
  TARGET_ENVIRONMENT_BOOTSTRAP,
  TARGET_ENVIRONMENT_SETUP,
  TARGET_PACKAGE_INSTALL,
  TARGET_PACKAGE_PUBLISH,
  TARGET_ENVIRONMENT_VERDACCIO_START,
  TARGET_ENVIRONMENT_INSTALL,
  TARGET_ENVIRONMENT_VERDACCIO_STOP,
} from '@push-based/nx-verdaccio';

describe('nx-verdaccio plugin create-nodes-v2', () => {
  let tree: Tree;
  const projectA = 'lib-a';
  const projectB = 'lib-b';
  const projectAE2e = `${projectA}-e2e`;
  const e2eProjectARoot = join('projects', projectAE2e);
  const baseDir = `tmp/environments/${process.env['NX_TASK_TARGET_PROJECT']}/__test__/create-nodes-v2`;

  beforeEach(async () => {
    tree = await addJsLibToWorkspace(projectA);
    await addJsLibToWorkspace(projectB, tree);
    await addJsLibToWorkspace(projectAE2e, tree);
    updateProjectConfiguration(tree, projectAE2e, {
      root: e2eProjectARoot,
      projectType: 'application',
    });
  });

  afterEach(async () => {
    //  await teardownTestFolder(baseDir);
  });

  it('should add package targets to library project', async () => {
    const cwd = join(baseDir, 'add-pkg-targets');
    registerPluginInWorkspace(tree, {
      plugin: '@push-based/nx-verdaccio',
      options: {
        environments: {
          targetNames: ['e2e'],
        },
      },
    });
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, projectA);
    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      [TARGET_PACKAGE_INSTALL]: expect.objectContaining({
        dependsOn: [
          {
            target: TARGET_PACKAGE_PUBLISH,
            params: 'forward',
          },
          {
            target: TARGET_PACKAGE_INSTALL,
            projects: 'dependencies',
            params: 'forward',
          },
        ],
        executor: '@push-based/nx-verdaccio:pkg-install',
      }),
      [TARGET_PACKAGE_PUBLISH]: expect.objectContaining({
        dependsOn: [
          {
            params: 'forward',
            target: 'build',
          },
          {
            params: 'forward',
            projects: 'dependencies',
            target: 'nxv-pkg-publish',
          },
        ],
        executor: '@push-based/nx-verdaccio:pkg-publish',
      }),
    });

    expect(projectJson.targets).toMatchSnapshot();
  });

  it('should NOT add package targets to application project', async () => {
    const cwd = join(baseDir, 'no-pkg-targets');
    registerPluginInWorkspace(tree, {
      plugin: '@push-based/nx-verdaccio',
      options: {
        environments: {
          targetNames: ['e2e'],
        },
      },
    });
    await materializeTree(tree, cwd);

    const { projectJson } = await nxShowProjectJson(cwd, projectAE2e);

    expect(projectJson.targets).toStrictEqual(
      expect.not.objectContaining({
        [TARGET_PACKAGE_INSTALL]: expect.any(Object),
        [TARGET_PACKAGE_PUBLISH]: expect.any(Object),
      })
    );
  });

  it('should add package targets to library project if some tag of options.packages.filterByTag match', async () => {
    const cwd = join(baseDir, 'add-pkg-targets-filterByTag');
    registerPluginInWorkspace(tree, {
      plugin: '@push-based/nx-verdaccio',
      options: {
        environments: {
          targetNames: ['e2e'],
        },
        packages: {
          filterByTags: ['publish'],
        },
      },
    });
    updateProjectConfiguration(tree, projectB, {
      root: `projects/${projectB}`,
      sourceRoot: 'projects/lib-b/src',
      projectType: 'library',
      tags: ['publish'],
    });
    await materializeTree(tree, cwd);

    const { projectJson: projectJsonB } = await nxShowProjectJson(
      cwd,
      projectB
    );
    expect(projectJsonB.name).toBe(projectB);
    expect(projectJsonB.tags).toStrictEqual(['publish']);
    expect(projectJsonB.targets).toStrictEqual(
      expect.objectContaining({
        [TARGET_PACKAGE_INSTALL]: expect.any(Object),
        [TARGET_PACKAGE_PUBLISH]: expect.any(Object),
      })
    );

    const { projectJson: projectJsonA } = await nxShowProjectJson(
      cwd,
      projectA
    );
    expect(projectJsonA.name).toBe(projectA);
    expect(projectJsonA.tags).toStrictEqual([]);
    expect(projectJsonA.targets).toStrictEqual(
      expect.not.objectContaining({
        [TARGET_PACKAGE_INSTALL]: expect.any(Object),
        [TARGET_PACKAGE_PUBLISH]: expect.any(Object),
      })
    );
  });

  it('should add environment targets to project with targetName e2e dynamically', async () => {
    const cwd = join(baseDir, 'add-env-targets');
    registerPluginInWorkspace(tree, {
      plugin: '@push-based/nx-verdaccio',
      options: {
        environments: {
          targetNames: ['e2e'],
        },
      },
    });
    updateProjectConfiguration(tree, projectAE2e, {
      root: e2eProjectARoot,
      projectType: 'application',
      targets: {
        e2e: {},
      },
    });
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, projectAE2e);
    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual(
      expect.objectContaining({
        e2e: expect.objectContaining({
          dependsOn: [
            {
              params: 'forward',
              target: TARGET_ENVIRONMENT_SETUP,
            },
          ],
        }),
        [TARGET_ENVIRONMENT_BOOTSTRAP]: expect.objectContaining({
          executor: '@push-based/nx-verdaccio:env-bootstrap',
          options: {
            environmentRoot: 'tmp/environments/lib-a-e2e',
          },
        }),
        [TARGET_ENVIRONMENT_INSTALL]: expect.objectContaining({
          dependsOn: [
            {
              params: 'forward',
              projects: 'dependencies',
              target: TARGET_PACKAGE_INSTALL,
            },
          ],
          executor: 'nx:noop',
          options: { environmentRoot: 'tmp/environments/lib-a-e2e' },
        }),
        [TARGET_ENVIRONMENT_SETUP]: expect.objectContaining({
          cache: false,
          executor: '@push-based/nx-verdaccio:env-setup',
          options: {
            environmentRoot: 'tmp/environments/lib-a-e2e',
          },
          outputs: [
            '{options.environmentRoot}/node_modules',
            '{options.environmentRoot}/package.json',
            '{options.environmentRoot}/.npmrc',
            '{options.environmentRoot}/package-lock.json',
          ],
        }),
        [TARGET_ENVIRONMENT_VERDACCIO_START]: expect.objectContaining({
          executor: '@nx/js:verdaccio',
          options: expect.objectContaining({
            clear: true,
            config: '.verdaccio/config.yml',
            environmentDir: 'tmp/environments/lib-a-e2e',
            port: expect.any(Number), // random port number
            projectName: 'lib-a-e2e',
            storage: 'tmp/environments/lib-a-e2e/storage',
          }),
        }),
        [TARGET_ENVIRONMENT_VERDACCIO_STOP]: expect.objectContaining({
          executor: '@push-based/nx-verdaccio:kill-process',
          options: {
            filePath: 'tmp/environments/verdaccio-registry.json',
          },
        }),
      })
    );

    expect({
      ...projectJson.targets,
      [TARGET_ENVIRONMENT_VERDACCIO_START]: {
        ...projectJson.targets[TARGET_ENVIRONMENT_VERDACCIO_START],
        options: {
          ...projectJson.targets[TARGET_ENVIRONMENT_VERDACCIO_START].options,
          port: expect.any(Number),
        },
      },
    }).toMatchSnapshot();
  });

  it('should NOT add environment targets to project without targetName e2e', async () => {
    const cwd = join(baseDir, 'no-env-targets');
    registerPluginInWorkspace(tree, {
      plugin: '@push-based/nx-verdaccio',
      options: {
        environments: {
          targetNames: ['e2e'],
        },
      },
    });
    await materializeTree(tree, cwd);

    const { projectJson } = await nxShowProjectJson(cwd, projectAE2e);

    expect(projectJson.targets).toStrictEqual(
      expect.not.objectContaining({
        [TARGET_ENVIRONMENT_BOOTSTRAP]: expect.any(Object),
        [TARGET_ENVIRONMENT_INSTALL]: expect.any(Object),
        [TARGET_ENVIRONMENT_SETUP]: expect.any(Object),
        [TARGET_ENVIRONMENT_VERDACCIO_START]: expect.any(Object),
        [TARGET_ENVIRONMENT_VERDACCIO_STOP]: expect.any(Object),
      })
    );
  });
});
