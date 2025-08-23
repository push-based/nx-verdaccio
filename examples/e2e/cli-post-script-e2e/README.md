# Nx Verdaccio Example - Custom Test Environment Setup 🧪

This example demonstrates how to set up a custom test environment for projects with specific tags.
It creates a Nx workspace, installs the package dependencies after the Nx setup is done, and runs the E2E tests for the project.

## Plugin Configuration

**nx.json**

```json
{
  "plugins": [
    {
      "plugin": "@push-based/nx-verdaccio",
      "options": {
        "environments": {
          "targetNames": ["e2e"]
        }
      }
    }
  ]
}
```

## Project Configuration

**projects/utils/project.json**

```jsonc
{
  "implicitDependencies": ["cli"],
  "targets": {
    "nxv-env-setup": {
      "options": {
        "skipInstall": true,
        "postScript": "npx tsx --tsconfig examples/e2e/cli-post-script-e2e/tsconfig.spec.json examples/e2e/cli-post-script-e2e/setup/exec-global-setup.ts"
      }
    },
    "e2e": {
      // test provides data
    }
  }
}
```

**projects/utils/setup/exec-global-setup.ts**

```ts
export async function setup({ userconfig, envRoot, projectName, repoName }: { envRoot: string; repoName: string; userconfig: string; projectName: string }) {
  // setup nx environment for e2e tests
  await execSync(`npx --yes create-nx-workspace@latest --preset=ts-standalone --ci=skip --no-interactive --name=${repoName}`, {
    cwd: dirname(envRoot),
  });
  // install cli
  await execSync(`npm install @push-based/cli`, {
    cwd: envRoot,
  });

  // update project.json with target
  const json = JSON.parse((await readFile(join(envRoot, 'project.json'))).toString());
  await writeFile(
    join(envRoot, 'project.json'),
    JSON.stringify({
      ...json,
      targets: {
        ...json.targets,
        sort: {
          command: 'npx cli sort --filePath=users.json',
        },
      },
    })
  );

  // copy data to test
  await cp(join('examples', 'e2e', 'cli-post-scripts', 'fixtures', 'small-data'), envRoot, { recursive: true });
}
```

## Running the Example

```bash
nx run cli-post-script-e2e:nxv-e2e
```

## Inspect the test environment setup

```bash
nx run cli-post-script-e2e:nxv-env-setup --keepServerRunning --verboes
```
