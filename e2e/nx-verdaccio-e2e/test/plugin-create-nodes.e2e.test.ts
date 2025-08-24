import type { Tree } from '@nx/devkit';
import {
  addJsLibToWorkspace,
  materializeTree,
  nxShowProjectJson,
  registerPluginInWorkspace,
} from '@push-based/test-nx-utils';
import { join } from 'node:path';
import { updateProjectConfiguration } from 'nx/src/generators/utils/project-configuration';
import { afterEach, expect } from 'vitest';

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
    // await teardownTestFolder(baseDir);
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

    const { projectJson } = await nxShowProjectJson(cwd, projectAE2e);

    expect(projectJson.targets).toStrictEqual(
      expect.not.objectContaining({
        'nxv-package-install': expect.any(Object),
        'nxv-package-publish': expect.any(Object),
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
        'nxv-pkg-install': expect.any(Object),
        'nxv-pkg-publish': expect.any(Object),
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
          configurations: {},
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
            verdaccioStartTarget: 'nxv-verdaccio-start',
            verdaccioStopTarget: 'nxv-verdaccio-stop',
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
          executor: 'nx:run-commands',
          options: {
            environmentRoot: expect.toMatchPath('tmp/environments/lib-a-e2e'),
            command: expect.stringContaining(
              'echo "dependencies installed for'
            ),
          },
        }),
        'nxv-env-setup': expect.objectContaining({
          cache: true,
          executor: '@push-based/nx-verdaccio:env-setup',
          options: {
            envBootstrapTarget: 'nxv-env-bootstrap',
            envInstallTarget: 'nxv-env-install',
            envPublishOnlyTarget: 'nxv-env-publish-only',
            verdaccioStopTarget: 'nxv-verdaccio-stop',
          },
          inputs: [
            '{projectRoot}/project.json',
            {
              runtime: 'node --version',
            },
            {
              runtime: 'npm --version',
            },
            {
              externalDependencies: ['verdaccio'],
            },
            '^production',
          ],
          outputs: [
            '{options.environmentRoot}/.npmrc',
            '{options.environmentRoot}/package.json',
            '{options.environmentRoot}/package-lock.json',
            '{options.environmentRoot}/node_modules',
          ],
        }),
        'nxv-verdaccio-start': expect.objectContaining({
          executor: '@nx/js:verdaccio',
          options: expect.objectContaining({
            clear: true,
            config: '.verdaccio/config.yml',
            environmentDir: expect.toMatchPath('tmp/environments/lib-a-e2e'),
            port: expect.any(Number), // random port number
            projectName: 'lib-a-e2e',
            storage: expect.toMatchPath('tmp/environments/lib-a-e2e/storage'),
          }),
        }),
        'nxv-verdaccio-stop': expect.objectContaining({
          executor: '@push-based/nx-verdaccio:kill-process',
          options: {
            filePath: expect.toMatchPath(
              'tmp/environments/verdaccio-registry.json'
            ),
          },
        }),
        'nxv-e2e': expect.objectContaining({
          executor: '@push-based/nx-verdaccio:env-teardown',
          dependsOn: [
            {
              params: 'forward',
              target: 'e2e',
            },
          ],
        }),
        'nxv-env-teardown': expect.objectContaining({
          executor: '@push-based/nx-verdaccio:env-teardown',
        }),
      })
    );
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
        'nxv-env-bootstrap': expect.any(Object),
        'nxv-env-install': expect.any(Object),
        'nxv-env-setup': expect.any(Object),
        'nxv-verdaccio-start': expect.any(Object),
        'nxv-verdaccio-stop': expect.any(Object),
      })
    );
  });

  it('should use custom target names if provided', async () => {
    const cwd = join(baseDir, 'add-env-targets');
    registerPluginInWorkspace(tree, {
      plugin: '@push-based/nx-verdaccio',
      options: {
        environments: {
          inferredTargets: {
            e2e: 'e2e-test',
            verdaccioStart: 'verdaccio',
            verdaccioStop: 'stop-verdaccio',
          },
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
        'e2e-test': expect.any(Object),
        verdaccio: expect.any(Object),
        'stop-verdaccio': expect.any(Object),
        'nxv-env-install': expect.any(Object),
        'nxv-env-teardown': expect.any(Object),
        'nxv-env-bootstrap': expect.objectContaining({
          options: {
            verdaccioStartTarget: 'verdaccio',
            verdaccioStopTarget: 'stop-verdaccio',
          },
        }),
        'nxv-env-setup': expect.objectContaining({
          options: {
            verdaccioStopTarget: 'stop-verdaccio',
            envBootstrapTarget: 'nxv-env-bootstrap',
            envInstallTarget: 'nxv-env-install',
            envPublishOnlyTarget: 'nxv-env-publish-only',
          },
        }),
      })
    );
  });
});
