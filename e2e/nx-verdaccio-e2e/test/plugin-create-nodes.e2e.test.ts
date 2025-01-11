import type {ProjectConfiguration, Tree} from '@nx/devkit';
import {join} from 'node:path';
import {afterAll, afterEach, beforeAll, beforeEach, expect} from 'vitest';
import {nxShowProjectJson, registerPluginInWorkspace} from '@push-based/test-nx-utils';
import {copyDirectory, registerNxVerdaccioPlugin, registerPluginInNxJson} from '../setup/setup';
import {mkdir} from 'node:fs/promises';
import {
  TARGET_ENVIRONMENT_BOOTSTRAP,
  TARGET_ENVIRONMENT_INSTALL,
  TARGET_ENVIRONMENT_SETUP,
  TARGET_ENVIRONMENT_VERDACCIO_START, TARGET_ENVIRONMENT_VERDACCIO_STOP,
  TARGET_PACKAGE_INSTALL,
  TARGET_PACKAGE_PUBLISH
} from '@push-based/nx-verdaccio';
import {
  DEFAULT_TEST_FIXTURE_DIST,
  getTestEnvironmentRoot, teardownTestFolder,
} from '@push-based/test-utils';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {REPO_NAME} from '../fixtures/basic-nx-workspace';
import {copyFile} from "fs/promises";
import {updateJson} from '@push-based/test-utils';

describe('in a fresh Nx workspace', () => {
  const projectName = process.env['NX_TASK_TARGET_PROJECT'];
  const envRoot = getTestEnvironmentRoot(projectName);
  const basicNxReopPath = join(envRoot, DEFAULT_TEST_FIXTURE_DIST, `${REPO_NAME}-18`);
  const baseDir = join(envRoot, DEFAULT_TEST_FIXTURE_DIST, 'create-nodes-v2');

  beforeAll(async () => {
    await mkdir(baseDir, {recursive: true});
    await copyDirectory(basicNxReopPath, baseDir);
  });

  afterAll(async () => {
    // await teardownTestFolder(baseDir);
  });

  describe('with nx-verdaccio plugin installed', () => {
    beforeEach(async () => {
      await copyFile(join(basicNxReopPath, 'nx.json'), join(baseDir, 'nx.json'));
      await copyDirectory(join(basicNxReopPath, 'packages'), join(baseDir, 'packages'), {cleanup: true});
    });

    it('should add package targets to library project', async () => {
      await registerNxVerdaccioPlugin(baseDir);

      const {code, projectJson} = await nxShowProjectJson(baseDir, 'pkg');
      expect(code).toBe(0);

      expect(projectJson.targets).toStrictEqual(
        expect.objectContaining({
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
          })
        }));

      expect(projectJson.targets).toMatchSnapshot();
    });

    it('should NOT add package targets to application project', async () => {
      await registerNxVerdaccioPlugin(baseDir);

      const {projectJson} = await nxShowProjectJson(baseDir, 'pkg-e2e');

      expect(projectJson.targets).toStrictEqual(
        expect.not.objectContaining({
          [TARGET_PACKAGE_INSTALL]: expect.any(Object),
          [TARGET_PACKAGE_PUBLISH]: expect.any(Object),
        })
      );
    });

    it('should add package targets to library project if some tag of options.packages.filterByTag match', async () => {
      await registerNxVerdaccioPlugin(baseDir, {
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
      await updateJson<ProjectConfiguration>(join(baseDir, 'packages', 'pkg', 'project.json'), (json) => ({
        ...json,
        root: `packages/pkg`,
        sourceRoot: 'packages/pkg/src',
        projectType: 'library',
        tags: ['publish'],
      }));

      const {projectJson} = await nxShowProjectJson(
        baseDir,
        'pkg'
      );
      expect(projectJson.name).toBe('pkg');
      expect(projectJson.tags).toStrictEqual(expect.arrayContaining(['publish']));
      expect(projectJson.targets).toStrictEqual(
        expect.objectContaining({
          [TARGET_PACKAGE_INSTALL]: expect.any(Object),
          [TARGET_PACKAGE_PUBLISH]: expect.any(Object),
        })
      );
    });

    it.only('should add environment targets to project with targetName e2e dynamically', async () => {
      await registerNxVerdaccioPlugin(baseDir);
      await updateJson<ProjectConfiguration>(join(baseDir, 'packages', 'pkg-e2e', 'project.json'), (json) => ({
        ...json,
        name: 'pkg-e2e',
        projectType: 'application',
        targets: {
          e2e: {},
        },
        implicitDependencies: ['pkg'],
      }));

      const {code, projectJson} = await nxShowProjectJson(baseDir, 'pkg-e2e');
      expect(code).toBe(0);

      expect(projectJson.targets).toStrictEqual(
        expect.objectContaining({
          e2e: expect.objectContaining({
            configurations: {},
            dependsOn: [
              {
                params: 'forward',
                target: TARGET_ENVIRONMENT_SETUP,
              },
            ],
          }),
          [TARGET_ENVIRONMENT_BOOTSTRAP]: expect.objectContaining({
            executor: '@push-based/nx-verdaccio:env-bootstrap',
          }),
          [TARGET_ENVIRONMENT_INSTALL]: expect.objectContaining({
            dependsOn: [
              {
                params: 'forward',
                projects: 'dependencies',
                target: TARGET_PACKAGE_INSTALL,
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
          [TARGET_ENVIRONMENT_SETUP]: expect.objectContaining({
            cache: true,
            executor: '@push-based/nx-verdaccio:env-setup',
            options: {},
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
          [TARGET_ENVIRONMENT_VERDACCIO_START]: expect.objectContaining({
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
          [TARGET_ENVIRONMENT_VERDACCIO_STOP]: expect.objectContaining({
            executor: '@push-based/nx-verdaccio:kill-process',
            options: {
              filePath: expect.toMatchPath(
                'tmp/environments/verdaccio-registry.json'
              ),
            },
          }),
          [TARGET_ENVIRONMENT_E2E]: expect.objectContaining({
            executor: '@push-based/nx-verdaccio:env-teardown',
            dependsOn: [
              {
                params: 'forward',
                target: 'e2e',
              },
            ],
          }),
          [TARGET_ENVIRONMENT_TEARDOWN]: expect.objectContaining({
            executor: '@push-based/nx-verdaccio:env-teardown',
          }),
        })
      );
    });

    it('should NOT add environment targets to project without targetName e2e', async () => {
      registerNxVerdaccioPlugin(baseDir, {
        plugin: '@push-based/nx-verdaccio',
        options: {
          environments: {
            targetNames: ['e2e'],
          },
        },
      });

      const {projectJson} = await nxShowProjectJson(baseDir, 'pkg-e2e');

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
});
