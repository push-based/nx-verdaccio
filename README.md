# NxVerdaccioE2eSetup

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ **This workspace maintains enterprise grade E2E steup for vitest and verdaccio** ✨

This workspace maintains a scalable and maintainable E2E setup for Vite tests and Verdaccio.

## Test it

Publishable project have a `publishable` tag.
Projects that need an environment have a `npm-env` tag.
Targets that need an environment set up before running depend on `{ "projects": "self", "target": "setup-env", "params": "forward"}`.

Production usage:

- `nx run cli-e2e:e2e` - setup environment and then run E2E tests for `cli-e2e`

Debug full environment setup:

- `nx run cli-e2e:setup-env` - setup environment for `cli-e2e`
- `nx run cli-e2e:setup-env --keepServerRunning` - keeps verdaccio running after setup

Debug full environment in 2 steps:

- `nx run cli-e2e:bootstrap-env` - setup folders and starts verdaccio for `cli-e2e`
- `nx run cli-e2e:install-env` - bootstraps and installs all dependencies for `cli-e2e`

Debug packages:

- `nx run cli-e2e:bootstrap-env` - setup folders and starts verdaccio for `cli-e2e`
- `nx run utils:npm-publish --environmentProject cli-e2e` - publishes `utils` and `models` to the verdaccio registry configured for `cli-e2e`
- `nx run utils:npm-install --environmentProject cli-e2e` - installs `utils` and `models` from the verdaccio registry configured for `cli-e2e`
- `nx run cli-e2e:stop-verdaccio` - stops the verdaccio server for `cli-e2e`

## Plugins

Configure the plugins in `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "@org/build.env",
      "options": {
        "environmentsDir": "tmp/environments"
      }
    }
  ]
}
```

### Dynamic targets

The plugins registered in `nx.json` are used to derive dynamic targets for different projects types:

- projects that need a environment to e.g. E2E test their dependencies
- packages maintaining the library code

@TODO

## Example projects and plugins

This repository maintains the following example projects and plugins to showcase a refactoring from existing E2E setup to a more maintainable and scalable setup:

- Run original: `nx original-cli-e2e:original-e2e`
- project `e2e-example/original-e2e`
  - setup script `e2e-example/original-e2e/setup/global-setup.e2e.ts`
- plugin `tools/e2e-example-plugins/original.plugin.ts`
- Run env: `nx env-cli-e2e:env-e2e`
  - project `e2e-example/env-e2e`
    - setup script `e2e-example/env-e2e/setup/global-setup.e2e.ts`
  - plugin `tools/e2e-example-plugins/env.plugin.ts`
- Run graph: `nx graph-cli-e2e:graph-e2e`
  - project `e2e-example/graph-e2e`
    - setup script `e2e-example/graph-e2e/setup/global-setup.e2e.ts`
  - plugin `tools/e2e-example-plugins/graph.plugin.ts`
- Run pretarget: `nx pretarget-cli-e2e:pretarget-e2e`
  - project `e2e-example/pretarget-e2e`
    - setup script `e2e-example/pretarget-e2e/setup/global-setup.e2e.ts`
  - plugin `tools/e2e-example-plugins/pretarget.plugin.ts`

## TODO

- remove usage of generatePackageJson in esbuild build targets

- make verdaccio-registry.json a constant!

- in `npm-install` executor:

  - make buildTarget configurable in the executor options, default to 'build'
  - use getPackageManagerCommand().install instead to be able to support yarn installation as well
  - use detectPackageManager() and getPackageManagerVersion() to deduce the userconfig path (e.g. .yarnrc, .npmrc, etc.)

- use [createNodesV2](https://nx.dev/nx-api/devkit/documents/CreateNodesV2) instead of [createNodes](https://nx.dev/nx-api/devkit/documents/CreateNodes) in `tooling/build-env/src/plugin/verdaccio-env.plugin.ts`

- in the plugin code, (maybe I got it wrong) it looks like some targets should only be added to the e2e project, but they are added to all projects.
```ts
export const createNodes: CreateNodes = [
  '**/project.json',
  (projectConfigurationFile) => {
    const projectConfiguration: ProjectConfiguration = readJsonFile(
      join(process.cwd(), projectConfigurationFile)
    );
    const projectName = projectConfiguration.name;
    const graph = readCachedProjectGraph();
    const projectNode = graph.nodes[projectConfiguration.name];
    if (projectNode.type !== 'e2e') {
      return {
        // npmTargets
      };
    }
    return {
      // verdaccioTargets, envTargets
    };
  },
];
```

## Connect with us!

- [Check out our services](https://push-based.io)
- [Follow us on Twitter](https://twitter.com/pushbased)
