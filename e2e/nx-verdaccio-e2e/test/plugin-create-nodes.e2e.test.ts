import type { Tree } from '@nx/devkit';
import { join } from 'node:path';
import { afterEach, expect } from 'vitest';
import {
  addJsLibToWorkspace,
  materializeTree,
  npmOptions,
  nxShowProjectJson,
  registerPluginInWorkspace,
} from '@push-based/test-nx-utils';
import { updateProjectConfiguration } from 'nx/src/generators/utils/project-configuration';

describe('nx-verdaccio plugin create-nodes-v2', () => {
  const e2eProjectName = process.env['NX_TASK_TARGET_PROJECT'];
  let tree: Tree;
  const project = 'my-lib';
  const projectE2e = `${project}-e2e`;
  const e2eProjectRoot = join('projects', projectE2e);
  const baseDir = `tmp/environments/${e2eProjectName}/__test__/create-nodes-v2`;

  beforeEach(async () => {
    tree = await addJsLibToWorkspace(project);
    tree = await addJsLibToWorkspace(projectE2e, tree);
    updateProjectConfiguration(tree, projectE2e, {
      root: e2eProjectRoot,
      projectType: 'application',
    });
  });

  afterEach(async () => {
    // await teardownTestFolder(baseDir);
  });

  it('should add package targets to library project dynamically', async () => {
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

    const { code, projectJson } = await nxShowProjectJson(cwd, project);
    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual({
      'nxv-pkg-install': expect.objectContaining({
        dependsOn: [
          {
            target: 'nxv-pkg-publish',
            params: 'forward',
          },
          {
            target: 'nxv-pkg-install',
            projects: 'dependencies',
            params: 'forward',
          },
        ],
        executor: '@push-based/nx-verdaccio:pkg-install',
      }),
      'nxv-pkg-publish': expect.objectContaining({
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

    const { projectJson } = await nxShowProjectJson(cwd, projectE2e);

    expect(projectJson.targets).toStrictEqual(
      expect.not.objectContaining({
        'nxv-pkg-install': expect.any(Object),
        'nxv-pkg-publish': expect.any(Object),
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
    updateProjectConfiguration(tree, projectE2e, {
      root: e2eProjectRoot,
      projectType: 'application',
      targets: {
        e2e: {},
      },
    });
    await materializeTree(tree, cwd);

    const { code, projectJson } = await nxShowProjectJson(cwd, projectE2e);
    expect(code).toBe(0);

    expect(projectJson.targets).toStrictEqual(
      expect.objectContaining({
        e2e: expect.objectContaining({
          dependsOn: [
            {
              params: 'forward',
              target: 'nxv-env-setup',
            },
          ],
        }),
        'nxv-env-bootstrap': expect.objectContaining({
          executor: '@push-based/nx-verdaccio:env-bootstrap',
          options: {
            environmentRoot: 'tmp/environments/my-lib-e2e',
          },
        }),
        'nxv-env-install': expect.objectContaining({
          dependsOn: [
            {
              params: 'forward',
              projects: 'dependencies',
              target: 'nxv-pkg-install',
            },
          ],
          executor: 'nx:noop',
          options: { environmentRoot: 'tmp/environments/my-lib-e2e' },
        }),
        'nxv-env-setup': expect.objectContaining({
          cache: false,
          executor: '@push-based/nx-verdaccio:env-setup',
          options: {
            environmentRoot: 'tmp/environments/my-lib-e2e',
          },
          outputs: [
            '{options.environmentRoot}/node_modules',
            '{options.environmentRoot}/package.json',
            '{options.environmentRoot}/.npmrc',
            '{options.environmentRoot}/package-lock.json',
          ],
        }),
        'nxv-env-verdaccio-start': expect.objectContaining({
          executor: '@nx/js:verdaccio',
          options: expect.objectContaining({
            clear: true,
            config: '.verdaccio/config.yml',
            environmentDir: 'tmp/environments/my-lib-e2e',
            port: expect.any(Number), // random port number
            projectName: 'my-lib-e2e',
            storage: 'tmp/environments/my-lib-e2e/storage',
          }),
        }),
        'nxv-env-verdaccio-stop': expect.objectContaining({
          executor: '@push-based/nx-verdaccio:kill-process',
          options: {
            filePath: 'tmp/environments/verdaccio-registry.json',
          },
        }),
      })
    );

    expect({
      ...projectJson.targets,
      ['nxv-env-verdaccio-start']: {
        ...projectJson.targets['nxv-env-verdaccio-start'],
        options: {
          ...projectJson.targets['nxv-env-verdaccio-start'].options,
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

    const { projectJson } = await nxShowProjectJson(cwd, projectE2e);

    expect(projectJson.targets).toStrictEqual(
      expect.not.objectContaining({
        'nxv-env-bootstrap': expect.any(Object),
        'nxv-env-install': expect.any(Object),
        'nxv-env-setup': expect.any(Object),
        'nxv-env-verdaccio-start': expect.any(Object),
        'nxv-env-verdaccio-stop': expect.any(Object),
      })
    );
  });
});
