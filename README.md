# NxVerdaccioE2eSetup

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ **This workspace maintains enterprise grade E2E steup for vitest and verdaccio** ✨

This workspace maintains a scalable and maintainable E2E setup for Vite tests and Verdaccio.

## Test it

Publishable project have a `publishable` tag.
Projects that need an environment have a `npm-env` tag.
Targets that need an environment set up before running depend on `{ "projects": "self", "target": "setup-env", "params": "forward"}`.

Production usage:

- `nx run cli-e2e:e2e` - setup environment and then run E2E tests for `cli-e2e`

Debug full environment setup:

- `nx run cli-e2e:setup-env` - setup environment for `cli-e2e`
- `nx run cli-e2e:setup-env --keepServerRunning` - keeps verdaccio running after setup

Debug full environment in 2 steps:

- `nx run cli-e2e:bootstrap-env` - setup folders and starts verdaccio for `cli-e2e`
- `nx run cli-e2e:install-env` - bootstraps and installs all dependencies for `cli-e2e`

Debug packages:

- `nx run cli-e2e:bootstrap-env` - setup folders and starts verdaccio for `cli-e2e`
- `nx run utils:npm-publish --environmentProject cli-e2e` - publishes `utils` and `models` to the verdaccio registry configured for `cli-e2e`
- `nx run utils:npm-install --environmentProject cli-e2e` - installs `utils` and `models` from the verdaccio registry configured for `cli-e2e`
- `nx run cli-e2e:stop-verdaccio` - stops the verdaccio server for `cli-e2e`

## Plugins

Configure the plugins in `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "@org/build.env",
      "options": {
        "environmentsDir": "tmp/environments"
      }
    }
  ]
}
```

### Dynamic targets

The plugins registered in `nx.json` are used to derive dynamic targets for different projects types:

- projects that need a environment to e.g. E2E test their dependencies
- packages maintaining the library code

@TODO

## TODO

- remove usage of generatePackageJson in esbuild build targets

## Connect with us!

- [Check out our services](https://push-based.io)
- [Follow us on Twitter](https://twitter.com/pushbased)
