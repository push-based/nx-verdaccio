# Setup Environment Executor

This executor helps to initiate an [environment folder](../../../../../README.md#-environment-folders-to-isolate-files-during-e2e-tests) and installs it`s dependent projects.
After running this task a ready to use environment is set up with packages published and installed with Verdaccio.

#### @push-based/build-env:env-setup

> [!notice]
> The setup executor does not keep the Verdaccio server running.
> To keeping the server running pass **`--keepServerRunning`**

## Usage

// project.json

```json
{
  "name": "my-project",
  "targets": {
    "build-env--env-setup": {
      "executor": "@push-based/build-env:env-setup"
    }
  }
}
```

By default, the Nx executor will derive the options from the executor options.

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

Show what will be executed without actually executing it:

`nx run my-project:build-env--env-setup --print-config`

## Options

| Name                  | type                      | description                                                                                                                          |
| --------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **envRoot**           | `string` (REQUIRED)       | The folder in which the package should get published. This folder is the environment folder and contains a configured `.npmrc` file. |
| **keepServerRunning** | `boolean` (DEFAULT false) | keep the Verdaccio server running after bootstraping the environment                                                                 |
| **printConfig**       | `boolean`                 | Print config without executing                                                                                                       |
| **verbose**           | `boolean`                 | Show more verbose logs                                                                                                               |
