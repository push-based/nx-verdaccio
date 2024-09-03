# @org/build-env

### Generators

#### Init

Install JS packages and register plugin.
See [init docs](./src/generators/init/README.md) for details

Examples:

- `nx g @org/build-env:init` - setup an environment in the workspace

#### Configuration

Adds a `build-env` target to your `project.json`.
See [configuration docs](./src/generators/configuration/README.md) for details

Examples:

- `nx g @org/build-env:configuration --project=<project-name>`
- `nx g @org/build-env:configuration --project=<project-name> --targetName=cp`
