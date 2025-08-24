import {
  type ExecutorContext,
  type NxJsonConfiguration,
  type PluginConfiguration,
  type ProjectConfiguration,
  type Tree,
  updateJson,
} from '@nx/devkit';
import { libraryGenerator } from '@nx/js';
import type { LibraryGeneratorSchema } from '@nx/js/src/generators/library/schema';
import { createTreeWithEmptyWorkspace } from 'nx/src/generators/testing-utils/create-tree-with-empty-workspace';
import { objectToCliArgs } from '@push-based/test-utils';
import { join, relative } from 'node:path';
import { executeProcess } from '../execute-process';

export function executorContext<
  T extends { projectName: string; cwd?: string }
>(nameOrOpt: string | T): ExecutorContext {
  const { projectName, cwd = process.cwd() } =
    typeof nameOrOpt === 'string' ? { projectName: nameOrOpt } : nameOrOpt;
  return {
    cwd,
    isVerbose: false,
    projectName,
    root: '.',
    nxJsonConfiguration: {},
    projectGraph: {
      nodes: {},
      dependencies: {},
    },
    projectsConfigurations: {
      projects: {
        [projectName]: {
          name: projectName,
          root: `libs/${projectName}`,
        },
      },
      version: 1,
    },
  };
}

export async function addJsLibToWorkspace(
  options:
    | string
    | (Omit<Partial<LibraryGeneratorSchema>, 'name'> & {
        name: string;
      }),
  tree?: Tree
) {
  const fileTree = tree ?? createTreeWithEmptyWorkspace({});
  const { name, ...normalizedOptions } =
    typeof options === 'string' ? { name: options } : options;

  await libraryGenerator(fileTree, {
    name,
    directory: `projects/${name}`,
    linter: 'none',
    unitTestRunner: 'none',
    testEnvironment: 'node',
    buildable: false,
    publishable: false,
    ...normalizedOptions,
  });

  return fileTree;
}

export function registerPluginInWorkspace(
  tree: Tree,
  configuration: PluginConfiguration
) {
  const normalizedPluginConfiguration =
    typeof configuration === 'string'
      ? {
          plugin: configuration,
        }
      : configuration;
  updateJson(tree, 'nx.json', (json: NxJsonConfiguration) => ({
    ...json,
    plugins: [...(json.plugins ?? []), normalizedPluginConfiguration],
  }));
}

export type NpmOptions = {
  prefix?: string;
  userconfig?: string;
};

export function npmOptions(options: {
  workspaceRoot: string;
  cwd?: string;
}): NpmOptions {
  const { cwd = process.cwd(), workspaceRoot } = options;
  const prefix = relative(cwd, workspaceRoot);
  return {
    prefix,
    userconfig: join(prefix, '.npmrc'),
  };
}

export async function nxShowProjectJson<T extends ProjectConfiguration>(
  cwd: string,
  project: string,
  options?: NpmOptions
) {
  const { prefix, userconfig } = options ?? {};
  const { code, stderr, stdout } = await executeProcess({
    command: 'npx',
    args: objectToCliArgs({
      _: ['nx', 'show', 'project', project, '--skipNxCache'],
      verbose: false, // debug errors
      json: true,
      prefix,
      userconfig,
    }),
    cwd,
    env: {
      ...process.env,
      NX_DAEMON: 'false',
      NX_CACHE_PROJECT_GRAPH: 'false',
    },
  });

  try {
    return { code, stderr, projectJson: JSON.parse(stdout) as T };
  } catch (error) {
    throw new Error(
      `Failed parsing show command result for string:\n${stdout}\n${
        (error as Error).message
      }`
    );
  }
}
