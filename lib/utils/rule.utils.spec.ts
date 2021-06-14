import { version } from '../../package.json';
import { createRule } from 'lib/utils/rule.utils';

describe('createRule()', () => {
  const name = 'rule';

  it('returns a rule module definition with the right url', () => {
    const rule = createRule({
      name,
      meta: {
        type: 'layout',
        schema: [],
        docs: {
          description: 'Description',
          recommended: false
        },
        messages: {}
      },
      defaultOptions: [],
      create() {
        return { foo: undefined };
      }
    });

    expect(rule.meta.docs?.url).toBe(
      `https://github.com/logicalhq/eslint-plugin/blob/v${version}/lib/rules/${name}.md`
    );
  });
});
