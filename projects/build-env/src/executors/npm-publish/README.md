# NPM Publish Executor

This executor helps to publish a [`pubishable`](../../../../../README.md#fine-grained-selection-of-publishable-projects) projects into a given [environment folder](../../../../../README.md#-environment-folders-to-isolate-files-during-e2e-tests).
This folder has to contain all needed configuration and files for the `npm publish` command to work.

#### @push-based/build-env:release-publish

> [!notice]
> To install or publish a package you need to have an environment set up.
> Run `nx run <project-name>:build-env--bootstrap` to one

## Usage

// project.json

```json
{
  "name": "my-project",
  "targets": {
    "build-env--npm-publish": {
      "executor": "@push-based/build-env:release-publish"
    }
  }
}
```

By default, the Nx executor will derive the options from the executor options.

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

Show what will be executed without actually executing it:

`nx run my-project:build-env--release-publish --print-config`

## Options

| Name           | type     | description                                                                                                                          |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **pkgVersion** | `string` | The packages version to publish. Falls back to get the current version from build output.                                            |
| **envRoot**    | `string` | The folder in which the package should get published. This folder is the environment folder and contains a configured `.npmrc` file. |
| **verbose**    | `bolean` | Show more verbose logs                                                                                                               |
