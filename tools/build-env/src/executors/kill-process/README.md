# Kill Process Executor

This executor is used to kill a process by PID, command of file.

#### @org/build-env:kill-process

## Usage

// project.json

```json
{
  "name": "my-project",
  "targets": {
    "stop-verdaccio-env": {
      "executor": "@org/build-env:kill-process"
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
    "stop-verdaccio-env": {
      "executor": "@org/build-env:kill-process",
      "options": {
        "filePath": "verdaccio-pid.json",
        "verbose": true,
        "progress": false
      }
    }
  }
}
```

Show what will be executed without actually executing it:

`nx run my-project:stop-verdaccio-env --dryRun`

## Options

| Name         | type      | description                                                        |
|--------------| --------- |--------------------------------------------------------------------|
| **filePath** | `string`  | Path to the file containing the PID of the process                 |
| **dryRun**   | `boolean` | To debug the executor, dry run the command without real execution. |
