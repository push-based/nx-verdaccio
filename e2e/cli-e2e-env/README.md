# cli-e2e-env

End-to-end tests for the `cli` library.

### Changes/generated files during e2e (already refactored to multiple verdaccio instances)

```sh
Root/ # 👈 this is your CWD
├── dist/
│   └── packages/
│       └── <project-name>/...
└── tmp/
    └── e2e/
        └── <project-name>/ # e2e setup
            ├── storage/... # npm publish/unpublish
            ├── node_modules/
            │   └── <org>
            │       └── <package-name>/... # npm install/uninstall
            ├── __test__/...
            │   └── <file-name>/... # e2e beforeEach
            │        └── <it-block-setup>/...
            ├── .npmrc # local npm config configured for project specific verdaccio registry
            ├── package-lock.json # npm install/uninstall
            └── package.json # npm install/uninstall
```

### Troubleshooting

- `nx start-server`
- `nx start-server <project-name>`
- `nx start-server <project-name> --storage tmp/e2e/<project-name>/storage`
- `nx start-env`
- `nx start-env <project-name> --workspaceRoot tmp/e2e/<project-name>`
- `nx npm-publish <project-name> --envProject=<env-project-name>`
- `nx run-many -t npm-publish --envProjectName=cli-e2e-env`
- `nx npm-install <project-name> --envProject=<env-project-name>`
- `nx run-many -t npm-install --envProjectName=cli-e2e-env`
