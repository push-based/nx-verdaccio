# Setup Environment Executor

This executor helps to initiate an [environment folder](../../../../../README.md#-environment-folders-to-isolate-files-during-e2e-tests) and installs it`s dependent projects.
After running this task a ready to use environment is set up with packages published and installed with Verdaccio.

#### @push-based/nx-verdaccio:env-setup

> [!notice]
> The setup executor does not keep the Verdaccio server running.
> To keeping the server running pass **`--keepServerRunning`**

## Usage

// project.json

```json
{
  "name": "my-project",
  "targets": {
    "env-setup": {
      "executor": "@push-based/nx-verdaccio:env-setup"
    }
  }
}
```

By default, the Nx executor will derive the options from the executor options.

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

Show what will be executed without actually executing it:

`nx run my-project:env-setup --print-config`

## Options

| Name                  | type                      | description                                                                                                                          |
| --------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **envRoot**           | `string` (REQUIRED)       | The folder in which the package should get published. This folder is the environment folder and contains a configured `.npmrc` file. |
| **keepServerRunning** | `boolean` (DEFAULT false) | keep the Verdaccio server running after bootstraping the environment                                                                 |
| **skipInstall**       | `boolean` (DEFAULT false) | Skip package install during setup                                                                                                    |
| **postScript**        | `string`                  | Script executed after packge publish/install is finished but before server teardown                                                  |
| **printConfig**       | `boolean`                 | Print config without executing                                                                                                       |
| **verbose**           | `boolean`                 | Show more verbose logs                                                                                                               |

## Examples

By default, the `env-setup` executor in combination with the `nx-verdaccio` plugin not need any configuration.

To give some examples, here are some common examples and their configurations:

### Change the environment root to a custom directory

By default, the environment root is set to `tmp/environments/<project-name>` where project name is the current executed task.
That means if you run `nx run my-project:env-setup` the environment root will be `tmp/environments/my-project`.

```json
{
  "name": "my-project",
  "targets": {
    "env-setup": {
      "options": {
        "envRoot": "/tmp/e2e/{projectName}"
      }
    },
    "e2e": {
      // ...
    }
  }
}
```

With the above configuration, the environment root will be `/tmp/e2e/my-project` and all environment files will be stored there.

### Use a custom script for the setup

If you want to run a custom script after the environment is set up, you can use the `postScript` option.

The following example assumes that you will install the packages in a separate step and only publish the packages.
After the packages are published, the post script executes, installs the needed dependencies programmatically and then tears down the server.

```jsonc
// projects/my-project/project.json
{
  "name": "my-project",
  "targets": {
    "env-setup": {
      "options": {
        "skipInstall": true,
        "postScript": "tsx --tsconfig=tsconfig.e2e.json projects/my-project/setup/global-setup.ts"
      }
    },
    "e2e": {
      // ...
    }
  }
}
```

```ts
// projects/my-project/setup/global-setup.ts

//
await copyFile(join(getTestEnvironmentRoot('my-project'), '.npmrc'), join(repoPath, '.npmrc'));
execSync('npm init @org/create-my-project');
```

In the above example, the `postScript` option is used to copy the to programmatic install the dependencies after the packages are published.
This gives flexibility and control over the environment setup process. See the [cli-post-script-e2e](../../../../../examples/e2e/cli-post-script-e2e/README.md) project for a more real life example.
