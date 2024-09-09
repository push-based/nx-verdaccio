# Example projects and plugins

This folder maintains the following example projects and plugins to showcase a refactoring from existing E2E setup to a more maintainable and scalable setup:

**`cli-e2e-original`**

- target: `nx run original-cli-e2e:original-e2e`
- project `e2e-example/original-e2e`
  - setup script `e2e-example/original-e2e/setup/global-setup.e2e.ts`
- plugin `tools/e2e-example-plugins/original.plugin.ts`

**`cli-e2e-env`**

- Run env: `nx env-cli-e2e:env-e2e`
  - project `e2e-example/env-e2e`
    - setup script `e2e-example/env-e2e/setup/global-setup.e2e.ts`
  - plugin `tools/e2e-example-plugins/env.plugin.ts`

**`cli-e2e-graph`**

- run `nx run graph-cli-e2e:graph-e2e`
  - project `e2e-example/graph-e2e`
    - setup script `e2e-example/graph-e2e/setup/global-setup.e2e.ts`
  - plugin `tools/e2e-example-plugins/graph.plugin.ts`

**`cli-e2e-pretarget`**

- run `nx run pretarget-cli-e2e:pretarget-e2e`
  - project `e2e-example/pretarget-e2e`
    - setup script `e2e-example/pretarget-e2e/setup/global-setup.e2e.ts`
  - plugin `tools/e2e-example-plugins/pretarget.plugin.ts`
