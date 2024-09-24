# Nx Verdaccio Environment Plugin

This plugin provides a zeros configuration setup to run e2e tests in a package manager environment.

## Getting started

1. Register and configure the plugins in `nx.json`:

```jsonc
{
  "plugins": [
    {
      "plugin": "@push-based/build-env",
      "options": {
        "environments": {
            "environmentsDir": "tmp/environments" // Optional
            "targetNames": ["e2e"] // Optional
        }
      }
    }
  ]
}
```

> [!NOTE]
> Your configured targets now has a new dependency configured:
>
> ```jsonc
> {
>   "name": "utils-e2e",
>   "targets": {
>     "e2e-special": {
>       "dependsOn": [
>         // dynamically aded
>         { "projects": "self", "target": "setup-env", "params": "forward" }
>       ]
>       // ...
>     }
>   }
>   // ...
> }
> ```

2. Add the package under test as `implicitDependency` to your e2e project.
   The plugin will detect implicit dependencies and use them for the environment setup.

```jsonc
// projects/utils-e2e/project.json
{
  "name": "utils-e2e",
  "implicitDependency": ["utils"]
}
```

Now you are ready to go.

3. Run your e2e test with `nx run utils-e2e:e2e`

Tadaaaa! 🎉

## Options

| Name                             | type                                  | description                                                                                  |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| **environments.environmentsDir** | `string` (DEFAULT 'tmp/environments') | The folder name of the generated environments                                                |
| **environments.targetNames**     | `string[]` (REQUIRED)                 | The target names of projects depending on environments                                       |
| **environments.filterByTag**     | `string[]` (REQUIRED)                 | The tag names a projects needs to have to be considered for a environments (match is one of) |
| **publishable.filterByTag**      | `string[]` (REQUIRED)                 | The tag names a projects needs to have to be considered for publishing (match is one of)     |

### Fine-grained selection of publishable projects

By default, all projects with type `library` get automatically the following targets applied:

- `build-env--npm-publish`
- `build-env--npm-install`

You can configure the plugin to only add those targets to projects with one or many specific tags.

1. Configure the plugin with a tag to act as filter

```jsonc
{
  "plugins": [
    {
      "plugin": "@push-based/build-env",
      "options": {
        "publishable": {
          "filterByTags": ["publishable"]
        }
      }
    }
  ]
}
```

2. Add a `publishable` tag to the projects considered in test environments

```jsonc
// projects/utils/project.json
{
  "name": "utils",
  //
  "tags": ["publishable"]
  // ...
}
```

### Fine-grained selection of projects that need a test environment set up

#### Filter by target names

You can configure the plugin to select only specific projects for environment creation.

1. Configure the plugin with a targets that will be configured with a dependency to the test environment

```jsonc
{
  "plugins": [
    {
      "plugin": "@push-based/build-env",
      "options": {
        "environments": {
          "targetNames": ["e2e", "e2e-static"]
        }
      }
    }
  ]
}
```

### Filter by tags

You can configure the plugin to only add those targets to projects with one or many specific tags.

1. Configure the plugin with a tag to act as filter

```jsonc
{
  "plugins": [
    {
      "plugin": "@push-based/build-env",
      "options": {
        "environments": {
          "filterByTags": ["npm-env"]
        }
      }
    }
  ]
}
```

2. Add a `environments` tag to the projects considered in test environments

```jsonc
// projects/utils/project.json
{
  "name": "lib-e2e",
  //
  "tags": ["npm-env"]
  // ...
}
```

**Example usage:**

- `nx run utils-e2e:e2e` - setup environment and then run E2E tests for `utils-e2e`
- `nx run utils-static-e2e:e2e --environmentRoot static-environments/user-lists` - setup NPM in existing environment and then run E2E tests for `utils-static-e2e`

## DX while debugging e2e tests

Debug full environment in 1 setup:

- `nx run utils-e2e:setup-env` - setup environment for `utils-e2e`
  - `nx run utils-e2e:setup-env --keepServerRunning` - keeps Verdaccio running after setup
- `nx run utils-e2e:stop-verdaccio` - stops the Verdaccio server for `utils-e2e`

Debug full environment in 2 steps:

- `nx run utils-e2e:bootstrap-env` - setup folders and starts Verdaccio for `utils-e2e`
- `nx run utils-e2e:install-env` - bootstraps and installs all dependencies for `utils-e2e`
- `nx run utils-e2e:stop-verdaccio` - stops the Verdaccio server for `utils-e2e`

Debug packages:

- `nx run utils-e2e:bootstrap-env` - setup folders and starts Verdaccio for `utils-e2e`
- `nx run utils:npm-publish --environmentProject utils-e2e` - publishes `utils` and `models` to the Verdaccio registry configured for `utils-e2e`
- `nx run utils:npm-install --environmentProject utils-e2e` - installs `utils` and `models` from the Verdaccio registry configured for `utils-e2e`
- `nx run utils-e2e:stop-verdaccio` - stops the Verdaccio server for `utils-e2e`

## Benefits in depth

In the below we point out a **scalable** and **maintainable** setup for Verdaccio environments.

> [!NOTE]
> If you want to read about common problems with a shared environment **we strongly suggest to read the [docs/motivation.md](./docs/motivation.md)**.

### 🛡️ Environment Folders to Isolate Files During E2E Tests

All files that change during testing are contained within an isolated folder, ensuring they don't interfere with your local setup or other tests.

By isolating the environment for each E2E project, you avoid conflicts with the local file system and package manager configurations, enabling parallel test execution without issues like publish, install or file conflicts.

```sh
Root/
├── dist/
│   └── projects/
│       └── <project-name>/...
├── tmp/
│    └── environments/
│        └── <project-name>/
│            ├── storage/... # npm publish/unpublish
│            │   └── <org>
│            │       └── <package-name>/...
│            ├── node_modules/ # npm install/uninstall
│            │   └── <org>
│            │        └── <package-name>/...
│            ├── __test__/...
│            │   └── <test-file-name>/...
│            │        └── <it-block-setup>/...
│            │             └── test.file.ts
│            ├── .npmrc # local npm config configured for project specific Verdaccio registry
│            ├── package-lock.json # skipped creation by default
│            └── package.json # npm install/uninstall
└── projects/
    └── <project-name>/...
```

### 🚀 Scalability - A Parallel-Friendly Setup

This solution allows for **parallel execution** of tests, which was not possible before due to conflicts with file systems and package managers.

- ⏱️No more waiting for tests to run sequentially. With isolated environments, each E2E test can run independently without interfering with others.
- ⏱️Environment setup and test setup are separated, which means **significantly faster execution** of the tests and less overhead in CPU and general runtime.

### ⚡ Task Performance - Optimized Execution

To further improve task performance, we can now treat the E2E environment as **build output**.
No need for a running server anymore.

This allows us to **cache** the environment and **reuse** it across tests, leading to faster performance:

- 🔥 As it is decoupled from the running server we can now save cache the target
- 🔥 No need to stop and restart the server between tests, saving CPU and memory
- 🔥 No need to uninstall packages or delete storage folders manually. We can simply delete the isolated folder when needed.
- 🔥 The system only installs the necessary packages, further reducing time and resource usage.

![utils-project-graph-idle.png](docs%2Futils-project-graph-idle.png)

#### Changes in source

```mermaid
flowchart TB
P[project-e2e:e2e]:::e2e-.implicit.->S[project-e2e:setup-env]:::build;
S-.implicit.->E[project:build]:::build;
classDef e2e stroke:#f00
classDef setup-env stroke:#f00
classDef build stroke:#f00
```

#### Changes in the test environments

```mermaid
flowchart TB
P[project-e2e:e2e]:::e2e-.implicit.->S[project-e2e:setup-env]:::setup-env;
S-.implicit.->E[project:build]:::build;
classDef e2e stroke:#f00
classDef setup-env stroke:#f00
```

#### Changes in tests

```mermaid
flowchart TB
P[project-e2e:e2e]:::e2e-.implicit.->S[project-e2e:setup-env]:::build;
S-.implicit.->E[project:build]:::build;
classDef e2e stroke:#f00
```

### ✨ DX - Developer Experience Simplified

The **NX task graph** makes it easier to discover and understand the setup. Instead of relying on complex global setup scripts:

- 🤌 No need for global setup files teardown or setup at all. The only connection to the tests files is just another target that runs before the E2E tests.
- 🤌 The process is faster because the test environment doesn’t require ongoing CPU or memory once set up.
- 🤌 Errors are easier to debug. Every step is on its own debugable.

### 🔧 Maintainability - Easy to Update and Manage

This approach makes the E2E setup more **maintainable** and easier to serve edge cases:

- A fine-grained task graph makes it easy to understand the project
- Since the environment doesn’t require a constantly running server, maintaining the setup becomes much simpler. The environment can be cached as a build output, reducing complexity.
- as the cleanup logic of a test is just deleting the files this debug effort is gone completely
- The NX task graph provides a clear visual overview of the process, making it easy to see what runs when and how the environment is set up.
- Configuring a test setup is in a single place and provides fine-grained configuration

![utils-task-graph-idle.png](docs%2Futils-task-graph-idle.png)

In summary, this new setup offers a more scalable, maintainable, and performant way to handle E2E testing.
By isolating environments and using NX’s powerful tools, it becomes easier to run, manage, and debug E2E tests across projects.

## Benchmarks

This is a first draft of how the benchmarks will look. ATM the data set it not big proper.

> [!warn]
> The data is a first draft of the structure and does not reflect a clean data set.
> Work on the real benchmark data in progress

|     cli:e2e      |  Common   | Optimized |
| :--------------: | :-------: | :-------: |
|  Execution Time  |   110 s   |   13 s    |
| Download Volume  | 381.68 MB | 381.68 MB |
|    Cacheable     |    ❌     |    ✅     |
|   Graph Nodes    |     1     |    13     |
| Can run parallel |    ❌     |    ✅     |

## Connect with us!

- [Check out our services](https://push-based.io)
- [Follow us on Twitter](https://twitter.com/pushbased)

<!--

```mermaid
flowchart TB
  
  UE["utils:e2e"] -->USE["utils:setup-env"]

USE["utils:setup-env"] --> UIE["utils:install-env"]
UIE["utils:install-env"] --> utils:install-env

subgraph utils:install-env
UI["utils:install"] --> UP["utils:publish"]
UI["utils:install"] --> MI["models:install"]
UP["utils:publish"] --> MP["models:publish"]
MI["models:install"] --> MP["models:publish"]
end

utils:install-env --> UB["utils:build"]
UB["utils:build"] --> MB["models:build"]

```

-->
```
