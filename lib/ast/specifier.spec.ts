import { Specifier } from 'lib/ast/specifier';

describe('Specifier', () => {
  let subject: Specifier;

  beforeEach(() => {
    subject = new Specifier();
  });

  it('initializes the class with a hasComma to false', () => {
    expect(subject.hasComma).toBe(false);
  });
});
