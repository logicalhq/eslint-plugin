<h1 align="center">@logicalhq/eslint-plugin</h1>
<br>
<p align="center">
  <img src="https://d33wubrfki0l68.cloudfront.net/204482ca413433c80cd14fe369e2181dd97a2a40/092e2/assets/img/logo.svg" width="150" alt=""/>
</p>

<p align="center">
  A couple of custom ESLint rules we use at <a href="https://logical.work">Logical</a>.
</p>

<p align="center">
  <a href="https://logical.work">
    <img src="https://logicalhq.s3.ca-central-1.amazonaws.com/badges/logical-badge.svg" alt="Logical"/>
  </a>
  <a href="https://circleci.com/gh/logicalhq/eslint-plugin">
    <img src="https://flat.badgen.net/github/status/logicalhq/eslint-plugin/main/ci/circleci" alt="CircleCI Status"/>
  </a>
  <img src="https://flat.badgen.net/npm/v/@logicalhq/eslint-plugin" alt="Version"/>
</p>

<hr>

## Table of Contents

- [Getting Started](#getting-started)
- [License](#license)

## Getting Started

Make sure you have those peer dependencies installed first:

```bash
yarn add -D eslint typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

Then install the plugin:

```bash
yarn add -D @logicalhq/eslint-plugin
```

Don't forget to also update your `.eslintrc` configuration file:

```js
{
  "plugin": ["@logicalhq"]
}
```

## Rules

🔧 = Fixable

| Name                                                                                              | Description                                        | 🔧  |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --- |
| [`@logicalhq/imports`](https://github.com/logicalhq/eslint-plugin/blob/main/lib/rules/imports.md) | Standardize the imports order across the codebase. | 🔧  |

## Contribution

Please make sure to read the [Contributing Guide](./.github/CONTRIBUTING.md)
before making a pull request.

## License

This project is licensed under [BSD 2-Clause](https://spdx.org/licenses/BSD-2-Clause.html).
