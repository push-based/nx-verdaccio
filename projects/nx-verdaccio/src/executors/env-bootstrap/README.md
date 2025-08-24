# Bootstrap Environment Executor

This executor helps to initiate [environment](../../../../../docs/benefits.md#️-environment-folders-to-isolate-files-during-e2e-tests) into a given folder.
This folder contains all needed configuration and files for a Verdaccio registry as well as the package manager configuration.

**Environment folder**

````bash

```sh
Root/
└── tmp/
    └── environments/
        └── <project-name>/
            ├── storage/... # npm publish/unpublish
            │   └── <org>
            │       └── <package-name>/...
            ├── node_modules/ # npm install/uninstall
            │   └── <org>
            │       └── <package-name>/...
            ├── __test__/...
            │   └── <test-file-name>/...
            │       └── <it-block-env-setup>/...
            │           └── test.file.ts
            ├── .npmrc # local npm config configured for project specific Verdaccio registry
            ├── package-lock.json # skipped creation by default
            └── package.json # npm install/uninstall
````

#### @push-based/nx-verdaccio:env-bootstrap

> [!notice]
> The bootstrap executor keeps the Verdaccio server running.
> To stop the server **`nx run <project-name>:nxv--verdaccio-stop --environmentRoot path/to/environment`**
> To avoid keeping the server running pass **`--no-keepServerRunning`**

## Usage

In `project.json`:

```json
{
  "name": "my-project",
  "targets": {
    "env-bootstrap": {
      "executor": "@push-based/nx-verdaccio:env-bootstrap"
    }
  }
}
```

By default, the Nx executor will derive the options from the executor options.

```jsonc
{
  "name": "my-project",
  "targets": {
    "env-bootstrap": {
      "executor": "@code-pushup/nx-verdaccio:env-bootstrap",
      "options": {
        "keepServerRunning": false,
        "environmentRoot": "/tmp/test-npm-workspace",
        "verbose": true
      }
    }
  }
}
```

Show what will be executed without actually executing it:

`nx run my-project:env-bootstrap --print-config`

## Options

| Name                  | Type                     | Description                                                                                                                          |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **environmentRoot**   | `string` (REQUIRED)      | The folder in which the package should get published. This folder is the environment folder and contains a configured `.npmrc` file. |
| **keepServerRunning** | `boolean` (DEFAULT true) | keep the Verdaccio server running after bootstraping the environment                                                                 |
| **printConfig**       | `boolean`                | Print config without executing                                                                                                       |
| **verbose**           | `boolean`                | Show more verbose logs                                                                                                               |
