# Enforces a consistent imports order.

## Rule Details

This rules aims to standardize the imports order across the codebase.

## Usage

```json
{
  "@logicalhq/imports": [
    "error",
    {
      "scopes": ["@core", "@job"]
    }
  ]
}
```

## Options

```ts
type Options = {
  strategy?: string;
  scopes?: string[];
};

const defaultOptions: Options = {
  strategy: 'logical'
};
```

The rule accepts an options object with the following properties:

- `strategy` - Sets the strategy name to be used for imports ordering.
- `scopes`- Sets the scopes considered as local imports so imports can sort them accordingly..

The default config will set `logical` as the default strategy.

## Example

Example of import ordering produced by this rule (using the default `logical` strategy):

Before:

```ts
import { CreateCheckrunPayload } from '@job/modules/github/payloads/create-checkrun.payload';
import Redis from 'ioredis';
import { GithubService } from '@core/modules/github/github.service';
import { Job } from 'bull';
import { Logger } from '@core/app.logger';
import { GithubException } from '@core/modules/github/github.interfaces';
import { Process, Processor } from '@nestjs/bull';
import fs from 'fs';
import { ValidationService } from '@core/shared/validation/validation.service';
import { StartCheckrunPayload } from '@job/modules/github/payloads/start-checkrun.payload';
import { Injectable } from '@nestjs/common';
```

After:

```ts
import fs from 'fs';
import { Job } from 'bull';
import Redis from 'ioredis';
import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';

import { Logger } from '@core/app.logger';
import { GithubException } from '@core/modules/github/github.interfaces';
import { GithubService } from '@core/modules/github/github.service';
import { ValidationService } from '@core/shared/validation/validation.service';
import { CreateCheckrunPayload } from '@job/modules/github/payloads/create-checkrun.payload';
import { StartCheckrunPayload } from '@job/modules/github/payloads/start-checkrun.payload';
```
