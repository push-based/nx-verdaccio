# Verdaccio Testing Environments Nx Plugin

This plugin helps to add dynamic targets to execute environment tasks. 
This distinguishes between projects that maintain publishable packages and e2e test projects that depend on an environment where the publishable projects get installed.

#### @push-based/nx-verdaccio

## Usage

// `nx.json`:

```jsonc
{
  "plugins": [
    {
      "plugin": "@push-based/nx-verdaccio",
      "options": {
        "environments": {
            "environmentsDir": "tmp/environments" // Optional
            "targetNames": ["e2e"] // Optional
        }
      }
    }
  ]
}
```

Now run your e2e test with `nx run utils-e2e:e2e`

## Options

| Name                             | type                                  | description                                                                                  |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| **environments.environmentsDir** | `string` (DEFAULT 'tmp/environments') | The folder name of the generated environments                                                |
| **environments.targetNames**     | `string[]` (REQUIRED)                 | The target names of projects depending on environments                                       |
| **environments.filterByTag**     | `string[]` (REQUIRED)                 | The tag names a projects needs to have to be considered for a environments (match is one of) |
| **publishable.filterByTag**      | `string[]` (REQUIRED)                 | The tag names a projects needs to have to be considered for publishing (match is one of)     |

**Example usage:**

- `nx run utils-e2e:e2e` - setup environment and then run E2E tests for `utils-e2e`
- `nx run utils-static-e2e:e2e --environmentRoot static-environments/user-lists` - setup NPM in existing environment and then run E2E tests for `utils-static-e2e`
