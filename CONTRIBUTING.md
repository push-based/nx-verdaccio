# Contributing

## Setup

Prerequisites:

- Node.js installed (LTS version).

Make sure to install dependencies from the `package-jock.json`:

```sh
npm ci
```

## Environment Variables

This table provides a quick overview of the environmental setup, with detailed explanations in the corresponding sections.

@TODO reconsider if this section is needed

| Feature                                | Local Default | CI Default | Description                                 |
| -------------------------------------- | ------------- | ---------- | ------------------------------------------- |
| `env.DEFAULT_ENVIRNOMENTS_DIR` **❗️** | N/A           | N/A        | Path to the default environments directory. |

## Development

Refer to docs on [how to run tasks in Nx](https://nx.dev/core-features/run-tasks).

Some examples:

```sh
# visualize project graph
npx nx graph

# run unit tests for all projects
npx nx run-many -t unit-test

# run integration tests for all projects
npx nx run-many -t integration-test

# run E2E tests for CLI
npx nx e2e cli-e2e

# build CLI along with packages it depends on
npx nx build cli

# lint projects affected by changes (compared to main branch)
npx nx affected:lint

# run CLI command on this repository
npx nx cli -- collect
```

## Testing

Some of the plugins have a longer runtime. In order to ensure better DX, longer tests are excluded by default when executing tests locally.

Nx targets are used to encapsulate test related processes.

Projects have the following testing targets:

| tag                | description                |
| :----------------- | :------------------------- |
| `test`             | General testing target     |
| `unit-test`        | Unit tests                 |
| `integration-test` | Integration tests          |
| `e2e`              | General E2E testing target |
| `e2e-cy`           | Cypress E2E testing        |
| `e2e-vi`           | Vitest E2E testing         |
| `e2e-pl`           | Playwrite E2E testing      |

## Git

Commit messages must follow [conventional commits](https://conventionalcommits.org/) format.
In order to be prompted with supported types and scopes, stage your changes and run `npm run commit`.

Branching strategy follows [trunk-based development](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development) guidelines.
Pushing to remote triggers a CI workflow, which runs automated checks on your changes.

The main branch should always have a linear history.
Therefore, PRs are merged via one of two strategies:

- rebase - branch cannot contain merge commits ([rebase instead of merge](https://www.atlassian.com/git/tutorials/merging-vs-rebasing)),
- squash - single commit whose message is the PR title (should be in conventional commit format).

## Project tags

[Nx tags](https://nx.dev/core-features/enforce-module-boundaries) are used to enforce module boundaries in the project graph when linting.

Projects are tagged in two different dimensions - scope and type:

| tag                 | description                                                            | allowed dependencies                               |
| :------------------ | :--------------------------------------------------------------------- | :------------------------------------------------- |
| `scope:core`        | core features and CLI (agnostic towards specific plugins)              | `scope:core` or `scope:shared`                     |
| `scope:shared`      | data models, utility functions, etc. (not specific to core or plugins) | `scope:shared`                                     |
| `scope:tooling`     | supplementary tooling, e.g. code generation                            | `scope:tooling`, `scope:shared`                    |
| `scope:internal`    | internal project, e.g. example e2e                                     | any                                                |
| `type:app`          | application, e.g. CLI or example web app                               | `type:feature`, `type:util` or `type:testing-util` |
| `type:feature`      | library with business logic for a specific feature                     | `type:util` or `type:testing-util`                 |
| `type:util`         | general purpose utilities and types intended for reuse                 | `type:util` or `type:testing-util`                 |
| `type:e2e`          | E2E testing                                                            | `type:app`, `type:feature` or `type:testing-util`  |
| `type:e2e-vi`       | E2E testing with vitest                                                | `type:app`, `type:feature` or `type:testing-util`  |
| `type:e2e-cy`       | E2E testing with cypress                                               | `type:app`, `type:feature` or `type:testing-util`  |
| `type:e2e-pr`       | E2E testing with playwrite                                             | `type:app`, `type:feature` or `type:testing-util`  |
| `type:testing-util` | testing utilities                                                      | `type:util`                                        |

## Special folders

The repository standards organize reusable code specific to a target in dedicated folders at project root level.
This helps to organize and share target related code.

The following optional folders can be present in a project root;

- `setup` - test setup code specific for a given project
- `mocks` - test fixtures and utilities specific for a given project
- `docs` - documentation files specific for a given project
- `tooling` - tooling related code specific for a given project

# Release

```sh
nx release
```
