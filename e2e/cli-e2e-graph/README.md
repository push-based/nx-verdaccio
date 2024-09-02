# cli-e2e-graph

End-to-end tests for the `cli` library.

### Troubleshooting

- `nx start-server`
- `nx start-server <project-name>`
- `nx start-server <project-name> --storage tmp/e2e/<project-name>/storage`
- `nx start-env`
- `nx start-env <project-name> --workspaceRoot tmp/e2e/<project-name>`
- `nx npm-publish <project-name> --envProject=<env-project-name>`
- `nx run-many -t npm-publish --envProjectName=cli-e2e-graph`
- `nx npm-install <project-name> --envProject=<env-project-name>`
- `nx run-many -t npm-install --envProjectName=cli-e2e-graph`
