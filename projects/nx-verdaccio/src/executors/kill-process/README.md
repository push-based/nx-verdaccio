# Kill Process Executor

This executor helps to kill processes by `ProcessID` or a JSON file containing a property `pid` as number.

#### @push-based/nx-verdaccio:kill-process

## Usage

In `project.json`:

```json
{
  "name": "my-project",
  "targets": {
    "kill-process": {
      "executor": "@push-based/nx-verdaccio:kill-process"
    }
  }
}
```

By default, the Nx executor will derive the options from the executor options.

```jsonc
{
  "name": "my-project",
  "targets": {
    "kill-process": {
      "executor": "@push-based/nx-verdaccio:kill-process",
      "options": {
        "pid": "42312",
        "filePath": "/tmp/test-npm-workspace/process-id.json",
        "verbose": true
      }
    }
  }
}
```

Show what will be executed without actually executing it:

`nx run my-project:kill-process --print-config`

## Options

| Name         | Type      | Description                                            |
| ------------ | --------- | ------------------------------------------------------ |
| **pid**      | `number`  | Process ID to kill                                     |
| **filePath** | `string`  | Path to JSON file contaning a `pid` property as number |
| **verbose**  | `boolean` | Show more verbose logs                                 |
