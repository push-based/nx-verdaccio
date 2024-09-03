# Build Executor

This executor is used to prebuild environments, serves and caches them in a Nx workspace.

#### @org/build-env:build

## Usage

// project.json

```json
{
  "name": "my-project",
  "targets": {
    "build-env": {
      "executor": "@org/build-env:build"
    }
  }
}
```

By default, the Nx plugin will derive the options from the executor config.

The following things happen:

- ???

```jsonc
{
  "name": "my-project",
  "targets": {
    "build-env": {
      "executor": "@org/build-env:build",
      "options": {
        "projectPrefix": "cli", // upload.project = cli-my-project
        "verbose": true,
        "progress": false
        // persist and upload options as defined in CoreConfig
      }
    }
  }
}
```

Show what will be executed without actually executing it:

`nx run my-project:build-env --dryRun`

## Options

| Name              | type      | description                                                        |
| ----------------- | --------- | ------------------------------------------------------------------ |
| **projectPrefix** | `string`  | prefix for upload.project on non root projects                     |
| **dryRun**        | `boolean` | To debug the executor, dry run the command without real execution. |
| **bin**           | `string`  | Path to Code PushUp CLI                                            |

For all other options see the [CLI build documentation](../../cli/packages/cli/README.md#build-command).
