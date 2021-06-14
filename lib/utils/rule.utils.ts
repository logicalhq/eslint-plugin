import { ESLintUtils } from '@typescript-eslint/experimental-utils';

import { version } from '../../package.json';

export const createRule = ESLintUtils.RuleCreator(
  (name: string) =>
    `https://github.com/logicalhq/eslint-plugin/blob/v${version}/lib/rules/${name}.md`
);
