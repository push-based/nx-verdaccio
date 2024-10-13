# Teardown Environment Executor

This executor helps to cleanup a [environment](../../../../../README.md#-environment-folders-to-isolate-files-during-e2e-tests) of a given folder.
If a server is running for the given environment, it will be stopped.
If this folder is checked into github all it's changes will be reverted, if it is not checked into github, the folder will be deleted.

**Environment folder**

#### @push-based/nx-verdaccio:env-teardown

## Usage

// project.json

```json
{
  "name": "my-project",
  "targets": {
    "env-teardown": {
      "executor": "@push-based/nx-verdaccio:env-teardown"
    }
  }
}
```

By default, the Nx executor will derive the options from the executor options.

```jsonc
{
  "name": "my-project",
  "targets": {
    "env-teardown": {
      "executor": "@code-pushup/nx-verdaccio:env-teardown",
      "options": {
        "envRoot": "/tmp/test-npm-workspace"
        "verbose": true,
      }
    }
  }
}
```

Show what will be executed without actually executing it:

`nx run my-project:env-teardown --print-config`

## Options

| Name                  | type                     | description                                                                                                                          |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **envRoot**           | `string` (REQUIRED)      | The folder in which the package should get published. This folder is the environment folder and contains a configured `.npmrc` file. |
| **verbose**           | `boolean`                | Show more verbose logs                                                                                                               |
| **printConfig**       | `boolean`                | Print config without executing                                                                                                       |
