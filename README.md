# Enterprise Grade Testing with Verdaccio and Nx

### 🚀 Enterprise Grade Testing with Verdaccio and Nx ⚡

[![npm](https://img.shields.io/npm/v/%40push-based%2Fnx-verdaccio.svg)](https://www.npmjs.com/package/@push-based/nx-verdaccio)
[![release date](https://img.shields.io/github/release-date/push-based/nx-verdaccio)](https://github.com/push-based/nx-verdaccio/releases)
[![license](https://img.shields.io/github/license/push-based/nx-verdaccio)](https://opensource.org/licenses/MIT)
[![commit activity](https://img.shields.io/github/commit-activity/m/push-based/nx-verdaccio)](https://github.com/push-based/nx-verdaccio/pulse/monthly)
[![CI](https://github.com/push-based/nx-verdaccio/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/push-based/nx-verdaccio/actions/workflows/ci.yml?query=branch%3Amain)

Welcome to the **Verdaccio Testing Environments Nx Plugin** — your one-stop solution for running **blazingly fast**, **isolated**, and **scalable** end-to-end (e2e) tests with zero configuration. Yeah, you heard that right: **ZERO configuration**.

With this plugin, say goodbye to the old days of waiting around for your tests and hello to _next-level speed_. Plug it in, and you're good to go.

## Why You NEED This Plugin 🔥

**Key Features:**

- ⚙️ **ZERO Config** — You won’t need any global setup or teardown scripts.
- 🔥 **BRUTALLY FAST** — Up to **⚡110x faster⚡** than traditional setups. Yes, you read that right.
- 🛡️ **Isolated** — No more conflicts with local file systems. Everything’s clean.
- 🚀 **Scalable** — Run your tests in parallel, no matter how big your project.
- 🕒 **Optimized** — We cache everything we can, so your tests run faster over time.
- ⚡ **Developer Experience** — Streamlined and simplified. You focus on the code, we handle the setup.
- 🧪 **Easier Debugging** — Debugging e2e tests is now a piece of cake 🍰.

---

### 🏎️ **Speed Benchmarks** 🕒️

| Small Project (4 packages)    | Common Setup | Optimized Setup | [x] times faster | [%] percent faster |
| ----------------------------- | ------------ | --------------- | ---------------- | ------------------ |
| **Worst Case** Execution Time | 110 s        | 13 s            | 8.46x faster     | 746%               |
| **Best Case** Execution Time  | 110 s        | 1 s             | 110x faster      | 11000%             |

### 🧪 **Test Architecture Comparison** 📐

| Default Test Architecture                                              | Decoupled Test Architecture                                                      |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| ![test-architecture-bad.png](docs%2Ftest-architecture--schema-bad.png) | ![test-architecture--schema-good.png](docs%2Ftest-architecture--schema-good.png) |

### 🔗 **Tasks Architecture Comparison** 📐

| Default Task Architecture                                              | Decoupled Task Architecture                                                      |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| ![task-architecture-bad.png](docs%2Ftask-architecture--schema-bad.png) | ![task-architecture--schema-good.png](docs%2Ftask-architecture--schema-good.png) |

### 🔗 **Testing Dx Comparison** 🤓

| Default Testing Dx                                               | Cacheable Testing Dx                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| ![testing-dx--schema-bad.png](docs%2Ftesting-dx--schema-bad.png) | ![testing-dx--schema-good.png](docs%2Ftesting-dx--schema-good.png) |

### 🔗 **Debug Dx Comparison** 🐞

| Default Debug Dx                                             | Excellent Debug Dx                                             |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| ![debug-dx--schema-bad.png](docs%2Fdebug-dx--schema-bad.png) | ![debug-dx--schema-good.png](docs%2Fdebug-dx--schema-good.png) |

---

## Getting Started 🏁

### Step 1: Register and Configure in `nx.json`:

```jsonc
{
  "plugins": [
    {
      "plugin": "@push-based/nx-verdaccio",
      "options": {
        "environments": {
          "environmentsDir": "tmp/environments", // Optional
          "targetNames": ["e2e"] // Optional
        }
      }
    }
  ]
}
```

> [!NOTE]
> Your configured targets now has a new dependency configured:
>
> ```jsonc
> {
>   "name": "utils-e2e",
>   "targets": {
>     "e2e": {
>       "dependsOn": [
>         // dynamically added
>         { "target": "env-setup", "params": "forward" }
>       ]
>       // ...
>     }
>   }
>   // ...
> }
> ```

### Optional: Add the Package Under Test as implicitDependencies

Let the plugin detect your implicit dependencies:

```jsonc
// projects/utils-e2e/project.json
{
  "name": "utils-e2e",
  "implicitDependencies": ["utils"]
}
```

### Step 3: Run the E2E Test

```bash
nx run utils-e2e:e2e
```

Tadaaaa! 🎉 You’re now testing at light speed!

## Configuration Options 🛠️

| Name                             | type                                    | description                                                    |
| -------------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| **environments.environmentsDir** | `string` (DEFAULT `'tmp/environments'`) | Directory for environment storage.                             |
| **environments.targetNames**     | `string[]` (REQUIRED)                   | Target names for environment-based projects.                   |
| **environments.filterByTag**     | `string[]` (REQUIRED)                   | Only consider projects with these tags for environment setup.  |
| **publishable.filterByTag**      | `string[]` (REQUIRED)                   | Only consider projects with these tags for publishing targets. |

### Fine-Grained Control for Publishable Projects 🚀

Out of the box, all library-type projects get these targets:

- `nx-verdaccio--pkg-publish`
- `nx-verdaccio--pkg-install`

But if you want to narrow it down:

```jsonc
{
  "plugins": [
    {
      "plugin": "@push-based/nx-verdaccio",
      "options": {
        "packages": {
          "filterByTags": ["publishable"]
        }
      }
    }
  ]
}
```

Tag your projects accordingly:

```jsonc
// projects/utils/project.json
{
  "name": "utils",
  //
  "tags": ["publishable"]
  // ...
}
```

### Custom Test Environment Setup 🧪

#### Filter by target names

Want more control over which projects get their environments set up?

```jsonc
{
  "plugins": [
    {
      "plugin": "@push-based/nx-verdaccio",
      "options": {
        "environments": {
          "targetNames": ["e2e", "e2e-static"]
        }
      }
    }
  ]
}
```

### Filter by tags

Filter projects by tags to apply environment setup:

```jsonc
{
  "plugins": [
    {
      "plugin": "@push-based/nx-verdaccio",
      "options": {
        "environments": {
          "filterByTags": ["npm-env"]
        }
      }
    }
  ]
}
```

Tag those projects accordingly:

```jsonc
// projects/utils/project.json
{
  "name": "lib-e2e",
  //
  "tags": ["npm-env"]
  // ...
}
```

**Example Usage:**

- Run the E2E test for`utils-e2e`:  
  `nx run utils-e2e:e2e`
- Run E2E with specific environments:  
  `nx run utils-static-e2e:e2e --environmentRoot static-environments/user-lists`

### Customize inferred target names

The inferred Nx targets are prefixed by `nxv-`, e.g. `nxv-e2e` will run your test target (by default `e2e`) and ensure cleanup is done afterwards (`nxv-teardown`).
Other inferred targets include `nxv-env-setup`, `nxv-env-bootstrap`, `nxv-env-install`, `nxv-pkg-install`, `nxv-verdaccio-start`, etc.
You can find all these targets in the Nx graph (run `npx nx graph`).

You may prefer to infer different target names, e.g. so you can run `e2e-test` instead of `nxv-e2e`. All target names may be customized for both environment and package targets.

```jsonc
{
  "plugins": [
    {
      "plugin": "@push-based/nx-verdaccio",
      "options": {
        "environments": {
          "inferredTargets": {
            "e2e": "e2e-test", // default is "nxv-e2e"
            "setup": "e2e-test-setup" // default is "nxv-e2e-setup"
          }
        },
        "packages": {
          "inferredTargets": {
            "install": "npm-install" // default is "nxv-pkg-install"
          }
        }
      }
    }
  ]
}
```

## Benchmarks

This is a first draft of how the benchmarks will look. ATM the data set it not big enough.

> ⚠️
> The data is a first draft of the structure and does not reflect a clean data set.
> Work on the real benchmark data in progress

|            cli:e2e            | Common | Optimized | [x] times faster  | [%] percent faster |
| :---------------------------: | :----: | :-------: | :---------------: | :----------------: |
| Execution Time - _Worse case_ | 110 s  |   13 s    | 8.46 times faster |        746%        |
| Execution Time - _Best case_  | 110 s  |    1 s    |        110        |       11000%       |
|        Download Volume        | 381 MB |  381 MB   |        0%         |         0%         |
|           Cacheable           |   ❌   |    ✅     |        n/a        |        n/a         |
|          Graph Nodes          |   1    |    13     |        n/a        |        n/a         |
|          Parallelism          |   ❌   |    ✅     |        n/a        |        n/a         |

## Next Steps

- [Configure cacheable environments](./docs/benefits.md#-task-performance---optimized-execution)
- [Configure Static environments](./projects/nx-verdaccio/docs/static-environments.md)
- [Debugging](./projects/nx-verdaccio/README.md#debugging-e2e-environments)

## Stay Connected! 🔗

- [Check out our services](https://push-based.io)
- [Follow us on Twitter](https://twitter.com/pushbased)
