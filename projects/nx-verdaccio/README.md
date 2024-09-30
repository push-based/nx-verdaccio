# @push-based/nx-verdaccio

## 🔌 Plugins

### Verdaccio Test Environment Plugin

Add dynamic targets to generate Verdaccion environments for other tasks, e.g. testing.

See [nx-verdaccio plugin docs](./src/plugin/README.md) for details

## Executor

### Setup Environment Executor

This executor helps to initiate an [environment folder](../../../../../README.md#-environment-folders-to-isolate-files-during-e2e-tests) and installs it`s dependent projects.

// project.json

```jsonc
{
  "name": "my-project",
  "targets": {
    "env-setup": {
      "executor": "@code-pushup/nx-verdaccio:env-setup",
      "options": {
        "keepServerRunning": false
        "envRoot": "/tmp/test-npm-workspace"
        "verbose": true,
      }
    }
  }
}
```

Read more under [setup executor docs](./projects/nx-verdaccio/src/executors/setup/README.md).

### Bootstrap Environment Executor

This executor helps to initiate [environment](../../../../../README.md#-environment-folders-to-isolate-files-during-e2e-tests) into a given folder.

// project.json

```jsonc
{
  "name": "my-project",
  "targets": {
    "nx-verdaccio-env-bootstrap": {
      "executor": "@code-pushup/nx-verdaccio:env-bootstrap",
      "options": {
        "keepServerRunning": false
        "envRoot": "/tmp/test-npm-workspace"
        "verbose": true,
      }
    }
  }
}
```

Read more under [bootstrap executor docs](./projects/nx-verdaccio/src/executors/bootstrap/README.md).

### Kill Process Executor

This executor helps to kill processes by `ProcessID` or a JSON file containing a property `pid` as number.

// project.json

```jsonc
{
  "name": "my-project",
  "targets": {
    "nx-verdaccio-kill-process": {
      "executor": "@push-based/nx-verdaccio:kill-process"
      "options": {
        "pid": "42312"
        "filePath": "/tmp/test-npm-workspace/process-id.json"
        "verbose": true,
      }
    }
  }
}
```

Read more under [kill-process executor docs](./projects/nx-verdaccio/src/executors/kill-process/README.md).

### NPM Install Executor

This executor helps to install a [`pubishable`](../../../../../README.md#fine-grained-selection-of-publishable-projects) projects into a given [environment folder](../../../../../README.md#-environment-folders-to-isolate-files-during-e2e-tests).

// project.json

```jsonc
{
  "name": "my-project",
  "targets": {
    "nx-verdaccio-npm-install": {
      "executor": "@code-pushup/nx-verdaccio:pkg-install",
      "options": {
        "pkgVersion": "1.2.3"
        "envRoot": "/tmp/test-npm-workspace"
        "verbose": true,
      }
    }
  }
}
```

Read more under [pkg install executor docs](./projects/nx-verdaccio/src/executors/npm-install/README.md).

### NPM Publish Executor

This executor helps to publish a [`pubishable`](../../../../../README.md#fine-grained-selection-of-publishable-projects) projects into a given [environment folder](../../../../../README.md#-environment-folders-to-isolate-files-during-e2e-tests).

// project.json

```jsonc
{
  "name": "my-project",
  "targets": {
    "nx-verdaccio-npm-publish": {
      "executor": "@code-pushup/nx-verdaccio:pkg-publish",
      "options": {
        "pkgVersion": "1.2.3"
        "envRoot": "/tmp/test-npm-workspace"
        "verbose": true,
      }
    }
  }
}
```

Read more under [pkg publish executor docs](./projects/nx-verdaccio/src/executors/npm-publish/README.md).

## Debugging e2e environments

Debug full environment in 1 setup:

- `nx run utils-e2e:env-setup` - setup environment for `utils-e2e`
- `nx run utils-e2e:env-setup --keepServerRunning` - keeps Verdaccio running after setup
- `nx run utils-e2e:env-cleanup` - stops the Verdaccio server for `utils-e2e` folder and cleans up files

Debug full environment in 2 steps:

- `nx run utils-e2e:bootstrap-env` - setup folders and starts Verdaccio for `utils-e2e`
- `nx run utils-e2e:install-env` - bootstraps and installs all dependencies for `utils-e2e`
- `nx run utils-e2e:stop-verdaccio` - stops the Verdaccio server for `utils-e2e`

Debug packages:

- `nx run utils-e2e:bootstrap-env` - setup folders and starts Verdaccio for `utils-e2e`
- `nx run utils:pkg-publish --envProject utils-e2e` - publishes `utils` and `models` to the Verdaccio registry configured for `utils-e2e`
- `nx run utils:pkg-install --envProject utils-e2e` - installs `utils` and `models` from the Verdaccio registry configured for `utils-e2e`
- `nx run utils-e2e:stop-verdaccio` - stops the Verdaccio server for `utils-e2e`
