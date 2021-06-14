import { Character } from 'lib/ast/interface';

export function multiline(
  chunks: TemplateStringsArray,
  ...variables: any[]
): string {
  let size: number;
  return chunks
    .map(chunk =>
      chunk
        .split(Character.Newline)
        .map(line => {
          const match = /^(\s+).+/.exec(line);
          if (match?.[1]) {
            size ??= match[1].length;
            return `${match[1][0].repeat(
              match[1].length - size < 0 ? 0 : match[1].length - size
            )}${line.trimStart()}`;
          }
          return line;
        })
        .join(Character.Newline)
    )
    .reduce(
      (accumulator, chunk, index) =>
        `${accumulator}${chunk}${
          index in variables ? variables[index] : Character.Empty
        }`,
      Character.Empty
    );
}
