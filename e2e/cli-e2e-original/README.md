# cli-e2e-original

End-to-end tests for the `cli` library.

## Running the tests

- `nx e2e cli-e2e-original` - run E2E tests for the `cli-e2e-original` library.
  - run vitest setup - `e2e/cli-e2e-original/setup/global-setup.ts#setup`
    - `nx local-registry --storage`
    - `nx run-many --targets=nx-release-publish`
    - `nx run-many --targets=npm-install-e2e`
  - run tests
  - run vitest teardown - `e2e/cli-e2e-original/setup/global-setup.ts#teardown`
    - stop server
    - delete folder

### Included targets

- `workspace-source`
  - targets
    - `local-registry`
- `cli-e2e-original`
  - targets
    - `e2e`
- `models`,`utils`,`core`,`cli`
  - tags
    - `publishable`
  - targets
    - `original-npm.install`
    - `original-npm-uninstall`

### Changed or generated files during e2e

```sh
User/
 └── <user-name>/
     ├── .npmrc # 🔓 added registry and token entry to OS user specific npm config
     └──Root/ # 👈 this is your CWD
        ├── node_modules/
        │   └── <org>
        │       └── <package-name>/... # 🔓 npm install installs into repository folder
        ├── dist/
        │   └── packages/
        │       └── <project-name>/...
        ├── tmp/
        │   └── local-registry/ # 😓 hard to debug a dynamic port
        │       ├── storage/...
        │       │   └── <org>
        │       │       └── <package-name>/... # nx nx-release-publish saves the package's tarball here
        │       └── <test-name>/...
        │                └── <test-case>/...
        ├── package-lock.json # 🔓 npm install/uninstall installs into workspace root
        └── package.json # 🔓 npm install/uninstall installs into workspace root
```

## Troubleshooting

- `nx start-server`
- `nx start-server <project-name>`
- `nx start-server <project-name> --storage tmp/e2e/<project-name>/storage`
