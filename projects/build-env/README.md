# @push-based/build-env

## To Research

- Store Verdaccio state under .nx?
- Project usage across existing Nx projects (popular open-source libraries?)
- Research if we can use Nx release Node.js API instead of custom target?
- How to ensure the setup will work in Nx Agents?

**What can be cached**

- `setup-env`
  - npm workspace folder (.npmrc, package-lock.json, node_modules)
- `npm-publish`
  - inputs
    - build output, using dependent task output? careful though, [it is known to struggle with Nx cloud agents](https://github.com/nrwl/nx/issues/22745)
  - outputs
    - list of packages in registry under `.../storage/.verdaccio-db.json` e.g.: `{"list":["<package-name>"],"secret":"esKM34zA53wetObgi5f0Uu1e7iObmm+f"}``
    - tarball of package under `.../storage/@push-based/<package-name>-<version>.tgz`
      e.g.: `{workspaceRoot}/${environmentsDir}/{args.environmentProject}/storage/@push-based/${packageName}`,
    - `package.json` of package under `.../storage/@push-based/<package-name>/package.json`
- `npm-install`
  - outputs
    - list of installed packages under `.../package.json`
    - list of installed packages under `.../package-lock.json`
    - source of package under `.../node_modules/@push-based/<package-name>/*`  
      mehh, we know the node_modules reputation
  - inputs:
    - output of npm-publish(?), package.json
  - concerns: chicken-egg problem.
    - when only caching `package-lock.json`, we still need to run `<packageManager> install`, separate install in 2 steps?
    - when caching node_modules, obviously cache takes lot of room!
    - to install dependencies and generate lock file, we need the Verdaccio server running

**Caching scenarios**

1. what can be cached?
2. is more small caches better
3. how to visualize scenarios

- what is a worse/best case for e2e tests

### Generators

#### Configuration

Adds a `build-env` target to your `project.json`.
See [configuration docs](./src/generators/configuration/README.md) for details

Examples:

- `nx g @push-based/build-env:configuration --project=<project-name>`
- `nx g @push-based/build-env:configuration --project=<project-name> --targetName=cp`
