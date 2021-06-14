import { multiline } from 'test/utils/string.utils';

describe('multiline()', () => {
  it('strips and trims the multiline block', () => {
    expect(
      multiline`
        import { path } from 'fs';
        import {
          Service
        } from '@core';
      `
    ).toBe(
      `\nimport { path } from 'fs';\nimport {\n  Service\n} from '@core';\n`
    );
  });

  it('interpolates variables', () => {
    const variable = 'foo';

    expect(multiline`
      let a = "${variable}";
    `).toBe(`\nlet a = "foo";\n`);
  });
});
