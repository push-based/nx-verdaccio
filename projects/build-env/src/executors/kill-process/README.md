# Kill Process Executor

This executor helps to kill processes by `ProcessID` or a JSON file containing a property `pid` as number.

#### @push-based/build-env:kill-process

## Usage

// project.json

```json
{
  "name": "my-project",
  "targets": {
    "build-env--kill-process": {
      "executor": "@push-based/build-env:kill-process"
    }
  }
}
```

By default, the Nx executor will derive the options from the executor options.

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

Show what will be executed without actually executing it:

`nx run my-project:build-env--kill-process --print-config`

## Options

| Name         | type     | description                                            |
|--------------|----------|--------------------------------------------------------|
| **pid**      | `number` | Process ID to kill                                     |
| **filePath** | `string` | Path to JSON file contaning a `pid` property as number |
| **verbose**  | `bolean` | Show more verbose logs                                 |
