# NPM Install Executor

This executor helps to install a [`publishable`](../../../../../README.md#fine-grained-control-for-publishable-projects-) projects into a given [environment folder](../../../../../docs/benefits.md#️-environment-folders-to-isolate-files-during-e2e-tests).
This folder has to contain all needed configuration and files for the `npm install` command to work.

#### @push-based/nx-verdaccio:pkg-install

> [!notice]
> To install or publish a package you need to have an environment set up.
> Run `nx run <project-name>:nxv-bootstrap` to one

## Usage

In `project.json`:

```json
{
  "name": "my-project",
  "targets": {
    "nxv-pkg-install": {
      "executor": "@push-based/nx-verdaccio:pkg-install"
    }
  }
}
```

By default, the Nx executor will derive the options from the executor options.

```jsonc
{
  "name": "my-project",
  "targets": {
    "pkg-install": {
      "executor": "@code-pushup/nx-verdaccio:pkg-install",
      "options": {
        "pkgVersion": "1.2.3",
        "environmentRoot": "/tmp/test-npm-workspace",
        "verbose": true
      }
    }
  }
}
```

Show what will be executed without actually executing it:

`nx run my-project:pkg-install --print-config`

## Options

| Name                | Type      | Description                                                                                                                          |
| ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **pkgVersion**      | `string`  | The packages version to install. Falls back to get the current version from build output.                                            |
| **environmentRoot** | `string`  | The folder in which the package should get installed. This folder is the environment folder and contains a configured `.npmrc` file. |
| **verbose**         | `boolean` | Show more verbose logs                                                                                                               |
