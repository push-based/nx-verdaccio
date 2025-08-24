# Configure Static environments

The plugin can be configured to use static environments.
This is useful when you want to have existing test projects managed in your git history.

To use static environments, you need to configure the `environmentRoot` option in the related targets your `project.json` file.

```jsonc
// project.json
{
  "nxv-e2e": {
    "options": {
      "environmentRoot": "examples/my-env" // needed for clenaup
    }
  },
  "nxv-env-setup": {
    "options": {
      "environmentRoot": "examples/my-env" // needed for install
    }
  }
}
```

The `environmentRoot` will be used as root folder for package installation.
After the test the teardown function will delete the created folders and revert changes in the git history.
