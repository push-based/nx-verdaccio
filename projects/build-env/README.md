# @push-based/build-env

## Plugins

### Build Environment Plugin

Add dynamic targets to execute environment tasks.

See [build-environment plugin docs](./src/plugin/README.md) for details

Examples:

- `nx g @push-based/build-env-env-setup` - generates NPM workspace and installs packages
- `nx g @push-based/build-env-env-setup  --keepServerRunning` - keeps Verdaccio running for debug reasons

## Executor

### Setup Environment Executor

This executor helps to initiate an [environment folder](../../../../../README.md#-environment-folders-to-isolate-files-during-e2e-tests) and installs it`s dependent projects.

// project.json

```jsonc
{
  "name": "my-project",
  "targets": {
    "build-env--env-bootstrap": {
      "executor": "@code-pushup/build-env:env-bootstrap",
      "options": {
        "keepServerRunning": false
        "envRoot": "/tmp/test-npm-workspace"
        "verbose": true,
      }
    }
  }
}
```

Read more under [setup executor docs](./projects/build-env/src/executors/setup/README.md).

### Bootstrap Environment Executor

This executor helps to initiate [environment](../../../../../README.md#-environment-folders-to-isolate-files-during-e2e-tests) into a given folder.

// project.json

```jsonc
{
  "name": "my-project",
  "targets": {
    "build-env--env-bootstrap": {
      "executor": "@code-pushup/build-env:env-bootstrap",
      "options": {
        "keepServerRunning": false
        "envRoot": "/tmp/test-npm-workspace"
        "verbose": true,
      }
    }
  }
}
```

Read more under [bootstrap executor docs](./projects/build-env/src/executors/bootstrap/README.md).

### Kill Process Executor

This executor helps to kill processes by `ProcessID` or a JSON file containing a property `pid` as number.

// project.json

```jsonc
{
  "name": "my-project",
  "targets": {
    "build-env--kill-process": {
      "executor": "@push-based/build-env:kill-process"
      "options": {
        "pid": "42312"
        "filePath": "/tmp/test-npm-workspace/process-id.json"
        "verbose": true,
      }
    }
  }
}
```

Read more under [kill-process executor docs](./projects/build-env/src/executors/kill-process/README.md).

### NPM Install Executor

This executor helps to install a [`pubishable`](../../../../../README.md#fine-grained-selection-of-publishable-projects) projects into a given [environment folder](../../../../../README.md#-environment-folders-to-isolate-files-during-e2e-tests).

// project.json

```jsonc
{
  "name": "my-project",
  "targets": {
    "build-env--npm-install": {
      "executor": "@code-pushup/build-env:release-install",
      "options": {
        "pkgVersion": "1.2.3"
        "envRoot": "/tmp/test-npm-workspace"
        "verbose": true,
      }
    }
  }
}
```

Read more under [release install executor docs](./projects/build-env/src/executors/npm-install/README.md).

### NPM Publish Executor

This executor helps to publish a [`pubishable`](../../../../../README.md#fine-grained-selection-of-publishable-projects) projects into a given [environment folder](../../../../../README.md#-environment-folders-to-isolate-files-during-e2e-tests).

// project.json

```jsonc
{
  "name": "my-project",
  "targets": {
    "build-env--npm-publish": {
      "executor": "@code-pushup/build-env:release-publish",
      "options": {
        "pkgVersion": "1.2.3"
        "envRoot": "/tmp/test-npm-workspace"
        "verbose": true,
      }
    }
  }
}
```

Read more under [release publish executor docs](./projects/build-env/src/executors/npm-publish/README.md).
