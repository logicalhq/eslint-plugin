import { ESLintUtils } from '@typescript-eslint/experimental-utils';

import rule from 'lib/rules/imports.rule';
import { multiline } from 'test/utils/string.utils';

const tester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser'
});

tester.run('imports', rule, {
  valid: [
    {
      code: `import 'a';`
    },
    {
      code: `import a from 'b';`
    },
    {
      code: `import { a } from 'b';`
    },
    {
      code: `import { a, b } from 'c';`
    },
    {
      code: `import { a } from './c';`
    },
    {
      code: `import {} from 'a';`
    },
    {
      code: `import {   } from 'a';`
    },
    {
      code: `import * as a from 'b';`
    },
    {
      code: `import type a from 'a';`
    },
    {
      code: `import type {a} from 'a';`
    },
    {
      code: `import type {} from 'a';`
    },
    {
      code: `import type {    } from 'a';`
    },
    {
      code: `import obj from './something.json' assert { type: 'json' };`
    },
    {
      code: multiline`
        import 'a';
        import 'b';
      `
    },
    {
      code: multiline`
        import fs from 'fs';
        import { path } from 'fs';
      `
    },
    {
      code: multiline`
        import 'assets/css/grid.css';
        import 'assets/css/normalize.css';
        import 'assets/css/theme/dark.css';
      `
    },
    {
      code: multiline`
        import {
          a,
          b
        } from 'c';
      `
    },
    {
      code: multiline`
        // eslint-disable-next-line
        import c from 'd';
        import a from 'b';
      `
    },
    {
      code: multiline`
        import {
          a, // comment-1
          b // comment-2
        } from 'c';
      `
    },
    {
      code: multiline`
        import {
          a, // comment-1
          b // comment-2
        } from 'c';
        import {
          d, // comment-3
          e // comment-4
        } from 'f';
      `
    },
    {
      code: multiline`
        import a from 'a';
        import b from 'b';
        import c from 'c'; /* comment */
      `
    },
    {
      code: multiline`
        import a from 'a';
        import b from 'b';
        import c from 'c'; // comment
      `
    },
    {
      code: multiline`
        import type x1 from 'a';
        import type x2 from 'b';
      `
    },
    {
      code: multiline`
        import obj from './something.json' assert {
          type: 'fluffy bunny'
        };
      `
    },
    {
      code: multiline`
        const obj = await import('./something.json', {
          assert: { type: 'json' }
        })
      `
    }
  ],
  invalid: [
    {
      code: multiline`
        import x1 from 'b';
        import x2 from 'a';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import x2 from 'a';
        import x1 from 'b';
      `
    },
    {
      code: multiline`
        import x2 from 'b';
        import x1 from 'a';
        ;[].forEach();
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import x1 from 'a';
        import x2 from 'b';
        ;[].forEach();
      `
    },
    {
      code: multiline`
        import { path } from 'fs';
        import { Service } from '@core';
      `,
      options: [{ scopes: ['@core'] }],
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import { path } from 'fs';

        import { Service } from '@core';
      `
    },
    {
      code: multiline`
        import { path } from 'fs';
        import fs from 'fs';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import fs from 'fs';
        import { path } from 'fs';
      `
    },
    {
      code: multiline`
        import { foo } from 'b';
        import a from 'a';
        ;(async function() {
          await foo()
        })();
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import a from 'a';
        import { foo } from 'b';
        ;(async function() {
          await foo()
        })();
      `
    },
    {
      code: multiline`
        import x2 from 'b'
        import x7 from 'g';
        import x6 from 'f'
        ;import x5 from 'e'
        import x4 from 'd' ; import x3 from 'c'
        import x1 from 'a' ; [].forEach()
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import x1 from 'a' ;
        import x2 from 'b';
        import x3 from 'c';
        import x4 from 'd' ;
        import x5 from 'e';
        import x6 from 'f'
        ;
        import x7 from 'g'; [].forEach()
      `
    },
    {
      code: multiline`
        import x2 from 'b'
        import x1 from 'a' // a
        ;[].forEach()
        // another comment
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import x1 from 'a' // a
        ;
        import x2 from 'b';[].forEach()
        // another comment
      `
    },
    {
      code: multiline`
        import x2 from 'b'
        import x1 from 'a'
        ;
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import x1 from 'a'
        ;
        import x2 from 'b';
      `
    },
    {
      code: `import { e, b, a as c } from 'specifiers';`,
      errors: [{ messageId: 'imports' }],
      output: `import { a as c, b, e } from 'specifiers';`
    },
    {
      code: `import d, { e, b, a as c, } from 'specifiers-trailing-comma';`,
      errors: [{ messageId: 'imports' }],
      output: `import d, { a as c,b, e,  } from 'specifiers-trailing-comma';`
    },
    {
      code: `import { a as c, a as b2, b, a } from 'specifiers-renames';`,
      errors: [{ messageId: 'imports' }],
      output: `import { a, a as b2, a as c, b } from 'specifiers-renames';`
    },
    {
      code: multiline`
        import {
          B,
          a,
          A,
          b,
          B2,
          bb,
          BB,
          bB,
          Bb,
          ab,
          ba,
          Ba,
          BA,
          bA,
          x as d,
          x as C,
          img10,
          img2,
          img1,
          img10_black,
        } from 'specifiers-human-sort';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import {
          A,
          a,
          ab,
          B,
          b,
          B2,
          BA,
          Ba,
          bA,
          ba,
          BB,
          Bb,
          bB,
          bb,
          img1,
          img2,
          img10,
          img10_black,
          x as C,
          x as d,
        } from 'specifiers-human-sort';
      `
    },
    {
      code: `import { aaNotKeyword, zzNotKeyword, abstract, as, asserts, any, async, /*await,*/ boolean, constructor, declare, get, infer, is, keyof, module, namespace, never, readonly, require, number, object, set, string, symbol, type, undefined, unique, unknown, from, global, bigint, of } from 'keyword-identifiers';`,
      errors: [{ messageId: 'imports' }],
      output: `import { aaNotKeyword, abstract, any, as, asserts, async, /*await,*/bigint, boolean, constructor, declare, from, get, global, infer, is, keyof, module, namespace, never, number, object, of, readonly, require, set, string, symbol, type, undefined, unique, unknown, zzNotKeyword } from 'keyword-identifiers';`
    },
    {
      code: `import {e,b,a as c} from 'specifiers-no-spaces';`,
      errors: [{ messageId: 'imports' }],
      output: `import {a as c,b,e} from 'specifiers-no-spaces';`
    },
    {
      code: `import { b,a} from 'specifiers-no-space-before';`,
      errors: [{ messageId: 'imports' }],
      output: `import { a,b} from 'specifiers-no-space-before';`
    },
    {
      code: `import {b,a, } from 'specifiers-no-space-after-trailing';`,
      errors: [{ messageId: 'imports' }],
      output: `import {a,b, } from 'specifiers-no-space-after-trailing';`
    },
    {
      code: multiline`
        import {
          // c
          c,
          b, // b
          a
          // last
        } from 'specifiers-comments';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import {
          a,
          b, // b
          // c
          c
          // last
        } from 'specifiers-comments';
      `
    },
    {
      code: `import { b /* b */, a } from 'specifiers-comment-between';`,
      errors: [{ messageId: 'imports' }],
      output: `import { a, b /* b */ } from 'specifiers-comment-between';`
    },
    {
      code: multiline`
        import {
          c,
          a,
          // x
          // y
        } from 'specifiers-trailing';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import {
          a,
          c,
          // x
          // y
        } from 'specifiers-trailing';
      `
    },
    {
      code: multiline`
        import {
          /*c1*/ c, /*c2*/ /*a1
          */a, /*a2*/ /*
          after */
          // x
          // y
        } from 'specifiers-multiline-comments';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import {
        /*a1
          */a, /*a2*/  /*c1*/ c, /*c2*/
        /*
          after */
          // x
          // y
        } from 'specifiers-multiline-comments';
      `
    },
    {
      code: multiline`
        import {
          b,
          a /*
          after */
        } from 'specifiers-multiline-end-comment';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import {
          a,   b
        /*
          after */
        } from 'specifiers-multiline-end-comment';
      `
    },
    {
      code: multiline`
        import {
          b,
          a /*a*/
          /*
          after */
        } from 'specifiers-multiline-end-comment-after-newline';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import {
          a, /*a*/
          b
          /*
          after */
        } from 'specifiers-multiline-end-comment-after-newline';
      `
    },
    {
      code: multiline`
        import {
          b,
          a /*
          after */ } from 'specifiers-multiline-end-comment-no-newline';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import {
          a,   b
        /*
          after */ } from 'specifiers-multiline-end-comment-no-newline';
      `
    },
    {
      code: `/*1*//*2*/import/*3*/def,/*4*/{/*{*/e/*e1*/,/*e2*//*e3*/b/*b1*/,/*b2*/a/*a1*/as/*a2*/c/*a3*/,/*a4*/}/*5*/from/*6*/'specifiers-lots-of-comments';/*7*//*8*/`,
      errors: [{ messageId: 'imports' }],
      output: `/*1*//*2*/import/*3*/def,/*4*/{/*{*/a/*a1*/as/*a2*/c/*a3*/,/*a4*/b/*b1*/,/*b2*/e/*e1*/,/*e2*//*e3*/}/*5*/from/*6*/'specifiers-lots-of-comments';/*7*//*8*/`
    },
    {
      code: multiline`
        import { // start
          /* c1 */ c /* c2 */, // c3
          // b1
          b as /* b2 */ renamed
          , /* b3 */ /* a1
          */ a /* not-a
          */ // comment at end
        } from 'specifiers-lots-of-comments-multiline';
        import {
          e,
          d, /* d */ /* not-d
          */ // comment at end after trailing comma
        } from 'specifiers-lots-of-comments-multiline-2';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import { // start
        /* a1
          */ a,
          // b1
          b as /* b2 */ renamed
          , /* b3 */
          /* c1 */ c /* c2 */// c3
        /* not-a
          */ // comment at end
        } from 'specifiers-lots-of-comments-multiline';
        import {
          d, /* d */  e,
        /* not-d
          */ // comment at end after trailing comma
        } from 'specifiers-lots-of-comments-multiline-2';
      `
    },
    {
      code: multiline`
        import {
        b,
        a,
        } from 'specifiers-indent-0';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import {
        a,
        b,
        } from 'specifiers-indent-0';
      `
    },
    {
      code: multiline`
        import {
            b,
            a,
        } from 'specifiers-indent-4';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import {
            a,
            b,
        } from 'specifiers-indent-4';
      `
    },
    {
      code: multiline`
      \timport {
      \t\t\tb,
      \t\t\ta,
      \t} from 'specifiers-indent-tab';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
      \timport {
      \t\t\ta,
      \t\t\tb,
      \t} from 'specifiers-indent-tab';
      `
    },
    {
      code: multiline`
        import {
          //
          \tb,
            a,

              c,
          } from 'specifiers-indent-mixed';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import {
            a,
          //
          \tb,
              c,
          } from 'specifiers-indent-mixed';
      `
    },
    {
      code: multiline`
        require("c");

        import x1 from "b"
        import x2 from "a"
        require("c");

        import x3 from "b"
        import x4 from "a" // x4

        // c1
        require("c");
        import x5 from "b"
        // x6-1
        import x6 from "a" /* after
        */

        require("c"); import x7 from "b"; import x8 from "a"; require("c");
      `,
      errors: [
        { messageId: 'imports' },
        { messageId: 'imports' },
        { messageId: 'imports' },
        { messageId: 'imports' }
      ],
      output: multiline`
        require("c");

        import x2 from "a";
        import x1 from "b";
        require("c");

        import x4 from "a"; // x4
        import x3 from "b";

        // c1
        require("c");
        // x6-1
        import x6 from "a";
        import x5 from "b"; /* after
        */

        require("c"); import x8 from "a";
        import x7 from "b"; require("c");
      `
    },
    {
      code: multiline`
        import {
          //
          \tb,
            a,

              c,
          } from 'specifiers-indent-mixed';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import {
            a,
          //
          \tb,
              c,
          } from 'specifiers-indent-mixed';
      `
    },
    {
      code: multiline`
        import b from 'b';
        import a1 from 'a';
        import {a2} from 'a';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import a1 from 'a';
        import {a2} from 'a';
        import b from 'b';
      `
    },
    {
      code: multiline`
        import b from 'b';
        import {a2} from 'a';
        import a1 from 'a';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import a1 from 'a';
        import {a2} from 'a';
        import b from 'b';
      `
    },
    {
      code: multiline`
        import {} from "";
        import {} from ".";
        import {} from ".//";
        import {} from "./";
        import {} from "./B"; // B1
        import {} from "./b";
        import {} from "./B"; // B2
        import {} from "./A";
        import {} from "./a";
        import {} from "./_a";
        import {} from "./-a";
        import {} from "./[id]";
        import {} from "./,";
        import {} from "./ä";
        import {} from "./ä"; // “a” followed by “\u0308̈” (COMBINING DIAERESIS).
        import {} from "..";
        import {} from "../";
        import {} from "../a";
        import {} from "../_a";
        import {} from "../-a";
        import {} from "../[id]";
        import {} from "../,";
        import {} from "../a/..";
        import {} from "../a/../";
        import {} from "../a/...";
        import {} from "../a/../b";
        import {} from "../../";
        import {} from "../..";
        import {} from "../../a";
        import {} from "../../_a";
        import {} from "../../-a";
        import {} from "../../[id]";
        import {} from "../../,";
        import {} from "../../utils";
        import {} from "../../..";
        import {} from "../../../";
        import {} from "../../../a";
        import {} from "../../../_a";
        import {} from "../../../[id]";
        import {} from "../../../,";
        import {} from "../../../utils";
        import {} from "...";
        import {} from ".../";
        import {} from ".a";
        import {} from "/";
        import {} from "/a";
        import {} from "/a/b";
        import {} from "https://example.com/script.js";
        import {} from "http://example.com/script.js";
        import {} from "react";
        import {} from "async";
        import {} from "./a/-";
        import {} from "./a/.";
        import {} from "./a/0";
        import {} from "@/components/error.vue"
        import {} from "@/components/Alert"
        import {} from "~/test"
        import {} from "#/test"
        import {} from "fs";
        import {} from "fs/something";
        import {} from "Fs";
        import {} from "lodash/fp";
        import {} from "@storybook/react";
        import {} from "@storybook/react/something";
        import {} from "1";
        import {} from "1*";
        import {} from "a*";
        import img2 from "./img2";
        import img10 from "./img10";
        import img1 from "./img1";
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import {} from "fs";
        import {} from "";
        import {} from "/";
        import {} from "/a";
        import {} from "/a/b";
        import {} from "#/test";
        import {} from "~/test";
        import {} from "1";
        import {} from "1*";
        import {} from "a*";
        import {} from "async";
        import {} from "Fs";
        import {} from "fs/something";
        import {} from "http://example.com/script.js";
        import {} from "https://example.com/script.js";
        import {} from "lodash/fp";
        import {} from "react";
        import {} from "@/components/Alert";
        import {} from "@/components/error.vue";
        import {} from "@storybook/react";
        import {} from "@storybook/react/something";

        import {} from ".";
        import {} from "..";
        import {} from "...";
        import {} from ".../";
        import {} from "../";
        import {} from "../_a";
        import {} from "../-a";
        import {} from "../,";
        import {} from "../..";
        import {} from "../../";
        import {} from "../../_a";
        import {} from "../../-a";
        import {} from "../../,";
        import {} from "../../..";
        import {} from "../../../";
        import {} from "../../../_a";
        import {} from "../../../,";
        import {} from "../../../[id]";
        import {} from "../../../a";
        import {} from "../../../utils";
        import {} from "../../[id]";
        import {} from "../../a";
        import {} from "../../utils";
        import {} from "../[id]";
        import {} from "../a";
        import {} from "../a/..";
        import {} from "../a/...";
        import {} from "../a/../";
        import {} from "../a/../b";
        import {} from "./";
        import {} from "./_a";
        import {} from "./-a";
        import {} from "./,";
        import {} from "./[id]";
        import {} from ".//";
        import {} from "./A";
        import {} from "./a";
        import {} from "./ä"; // “a” followed by “̈̈” (COMBINING DIAERESIS).
        import {} from "./ä";
        import {} from "./a/-";
        import {} from "./a/.";
        import {} from "./a/0";
        import {} from "./B"; // B1
        import {} from "./B"; // B2
        import {} from "./b";
        import img1 from "./img1";
        import img2 from "./img2";
        import img10 from "./img10";
        import {} from ".a";
    `
    },
    {
      code: multiline`
        // before

        /* also
        before */ /* b */ import b from "b" // b
        // above d
          import d /*d1*/ from   "d" ; /* d2 */ /* before
          c0 */ // before c1
          /* c0
        */ /*c1*/ /*c2*/import c from 'c' ; /*c3*/ import a from "a" /*a*/ /*
          x1 */ /* x2 */
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        // before

        /* also
        before */ /* b */ import a from \"a\"; /*a*/
        /* b */ import b from \"b\"; // b
        /* before
          c0 */ // before c1
          /* c0
        */ /*c1*/ /*c2*/import c from 'c' ; /*c3*/
          // above d
          import d /*d1*/ from   \"d\" ; /* d2 */ /*
          x1 */ /* x2 */
      `
    },
    {
      code: multiline`
        import b from 'b'; // b
        import a from 'a';code();
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import a from 'a';
        import b from 'b'; // b
        code();
      `
    },
    {
      code: multiline`
        import b from "b"; // b
        import a from "a";/*
        after */
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import a from "a";
        import b from "b"; // b
        /*
        after */
      `
    },
    {
      code: multiline`
        // before
        /* also
        before */ import b from "b";
        import a from "a"; /*a*/ /* comment
        after */ // after
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        // before
        /* also
        before */ import a from "a"; /*a*/
        import b from "b"; /* comment
        after */ // after
      `
    },
    {
      code: multiline`
        import c from 'c'
        // b1

        // b2
        import b from 'b'
        // a

        import a from 'a'
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        // a
        import a from 'a';
        // b1
        // b2
        import b from 'b';
        import c from 'c';
      `
    },
    {
      code: multiline`
        import

        // import

        def /* default */

        ,

        // default

         {

          // c

          c /*c*/,

          /* b
           */

          b // b
          ,

          // a1

          // a2

          a

          // a3

          as

          // a4

          d

          // a5

          , // a6

          // last

        }

        // from1

        from

        // from2

        "c"

        // final

        ;
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import
        // import
        def /* default */
        ,
        // default
         {
          // a1
          // a2
          a
          // a3
          as
          // a4
          d
          // a5
          , // a6
          /* b
           */
          b // b
          ,
          // c
          c /*c*/,
          // last
        }
        // from1
        from
        // from2
        "c"
        // final
        ;
      `
    },
    {
      code: multiline`
        import {

              } from 'specifiers-empty';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import {
              } from 'specifiers-empty';
      `
    },
    {
      code: multiline`
        import React from "react";
        import Button from "../Button";
        import type {target, type as tipe, Button} from "../Button";

        import styles from "./styles.css";
        import { getUser } from "../../api";

        import PropTypes from "prop-types";
        import { /* X */ } from "prop-types";
        import classnames from "classnames";
        import { truncate, formatNumber } from "../../utils";
        import type X from "../Button";

        function pluck<T, K extends keyof T>(o: T, names: K[]): T[K][] {
          return names.map(n => o[n]);
        }
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import classnames from "classnames";
        import PropTypes from "prop-types";
        import { /* X */ } from "prop-types";
        import React from "react";

        import { getUser } from "../../api";
        import { formatNumber, truncate } from "../../utils";
        import Button from "../Button";
        import type X from \"../Button\";
        import type {Button,target, type as tipe } from \"../Button\";
        import styles from "./styles.css";

        function pluck<T, K extends keyof T>(o: T, names: K[]): T[K][] {
          return names.map(n => o[n]);
        }
      `
    },
    {
      code: multiline`
        import { forEach, isCollection } from 'iterall';
        import { GraphQLError } from '../error/GraphQLError';
        import { locatedError } from '../error/locatedError';
        import inspect from '../jsutils/inspect';
        import invariant from '../jsutils/invariant';
        import isInvalid from '../jsutils/isInvalid';
        import isNullish from '../jsutils/isNullish';
        import isPromise from '../jsutils/isPromise';
        import memoize3 from '../jsutils/memoize3';
        import promiseForObject from '../jsutils/promiseForObject';
        import promiseReduce from '../jsutils/promiseReduce';
        import type { ObjMap } from '../jsutils/ObjMap';
        import type { MaybePromise } from '../jsutils/MaybePromise';

        import { getOperationRootType } from '../utilities/getOperationRootType';
        import { typeFromAST } from '../utilities/typeFromAST';
        import { Kind } from '../language/kinds';
        import {
          getVariableValues,
          getArgumentValues,
          getDirectiveValues,
        } from './values';
        import {
          isObjectType,
          isAbstractType,
          isLeafType,
          isListType,
          isNonNullType,
        } from '../type/definition';
        import type {
          GraphQLObjectType,
          GraphQLOutputType,
          GraphQLLeafType,
          GraphQLAbstractType,
          GraphQLField,
          GraphQLFieldResolver,
          GraphQLResolveInfo,
          ResponsePath,
          GraphQLList,
        } from '../type/definition';
        import type { GraphQLSchema } from '../type/schema';
        import {
          SchemaMetaFieldDef,
          TypeMetaFieldDef,
          TypeNameMetaFieldDef,
        } from '../type/introspection';
        import {
          GraphQLIncludeDirective,
          GraphQLSkipDirective,
        } from '../type/directives';
        import { assertValidSchema } from '../type/validate';
        import type {
          DocumentNode,
          OperationDefinitionNode,
          SelectionSetNode,
          FieldNode,
          FragmentSpreadNode,
          InlineFragmentNode,
          FragmentDefinitionNode,
        } from '../language/ast';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import { forEach, isCollection } from 'iterall';

        import { GraphQLError } from '../error/GraphQLError';
        import { locatedError } from '../error/locatedError';
        import inspect from '../jsutils/inspect';
        import invariant from '../jsutils/invariant';
        import isInvalid from '../jsutils/isInvalid';
        import isNullish from '../jsutils/isNullish';
        import isPromise from '../jsutils/isPromise';
        import type { MaybePromise } from '../jsutils/MaybePromise';
        import memoize3 from '../jsutils/memoize3';
        import type { ObjMap } from '../jsutils/ObjMap';
        import promiseForObject from '../jsutils/promiseForObject';
        import promiseReduce from '../jsutils/promiseReduce';
        import type {
          DocumentNode,
          FieldNode,
          FragmentDefinitionNode,
          FragmentSpreadNode,
          InlineFragmentNode,
          OperationDefinitionNode,
          SelectionSetNode,
        } from '../language/ast';
        import { Kind } from '../language/kinds';
        import {
          isAbstractType,
          isLeafType,
          isListType,
          isNonNullType,
          isObjectType,
        } from '../type/definition';
        import type {
          GraphQLAbstractType,
          GraphQLField,
          GraphQLFieldResolver,
          GraphQLLeafType,
          GraphQLList,
          GraphQLObjectType,
          GraphQLOutputType,
          GraphQLResolveInfo,
          ResponsePath,
        } from '../type/definition';
        import {
          GraphQLIncludeDirective,
          GraphQLSkipDirective,
        } from '../type/directives';
        import {
          SchemaMetaFieldDef,
          TypeMetaFieldDef,
          TypeNameMetaFieldDef,
        } from '../type/introspection';
        import type { GraphQLSchema } from '../type/schema';
        import { assertValidSchema } from '../type/validate';
        import { getOperationRootType } from '../utilities/getOperationRootType';
        import { typeFromAST } from '../utilities/typeFromAST';
        import {
          getArgumentValues,
          getDirectiveValues,
          getVariableValues,
        } from './values';
      `
    },
    {
      code: multiline`
        import React, { useCallback } from 'react';
        import styled from 'styled-components';

        import { Icon } from '@polkadot/react-components';
        import type { ThemeProps } from '@polkadot/react-components/types';

        import Network from './Network';
        import type { Group } from './types';
      `,
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import React, { useCallback } from 'react';
        import styled from 'styled-components';
        import { Icon } from '@polkadot/react-components';
        import type { ThemeProps } from '@polkadot/react-components/types';

        import Network from './Network';
        import type { Group } from './types';
      `
    },
    {
      code: multiline`
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
      `,
      options: [{ scopes: ['@core', '@job'] }],
      errors: [{ messageId: 'imports' }],
      output: multiline`
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
      `
    },
    {
      code: multiline`
        import { useCurrentLocale } from '@/composables/use-i18n';
        import { useA11y } from '@/composables/use-a11y';
        import Button from '@/components/button.vue';
        import { defineComponent, onMounted, onUpdated } from '@vue/composition-api';
        import routes from '@/data/routes.yml';
      `,
      options: [{ scopes: ['@/', '@/composables', '@/components', '@/data'] }],
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import { defineComponent, onMounted, onUpdated } from '@vue/composition-api';

        import { useA11y } from '@/composables/use-a11y';
        import { useCurrentLocale } from '@/composables/use-i18n';
        import Button from '@/components/button.vue';
        import routes from '@/data/routes.yml';
      `
    },
    {
      code: multiline`
        import { EventEmitter2 } from '@nestjs/event-emitter';
        import {
          CommandInterface,
          CommandOptions
        } from '@cli/modules/program/command/command.interfaces';
        import obj from './something.json' assert { type: 'json' };
        import { STATIC_CONTEXT } from '@nestjs/core/injector/constants';
        import { basename } from 'path';
        import { Injectable } from '@nestjs/common';
        import { MetadataScanner, ModulesContainer } from '@nestjs/core';
        import {
          COMMAND_ARGS_METADATA,
          COMMAND_HIDDEN_METADATA,
          COMMAND_NAME_METADATA
        } from '@cli/modules/program/command/command.constants';
      `,
      options: [{ scopes: ['@cli'] }],
      errors: [{ messageId: 'imports' }],
      output: multiline`
        import { basename } from 'path';
        import { Injectable } from '@nestjs/common';
        import { MetadataScanner, ModulesContainer } from '@nestjs/core';
        import { STATIC_CONTEXT } from '@nestjs/core/injector/constants';
        import { EventEmitter2 } from '@nestjs/event-emitter';

        import obj from './something.json' assert { type: 'json' };
        import {
          COMMAND_ARGS_METADATA,
          COMMAND_HIDDEN_METADATA,
          COMMAND_NAME_METADATA
        } from '@cli/modules/program/command/command.constants';
        import {
          CommandInterface,
          CommandOptions
        } from '@cli/modules/program/command/command.interfaces';
      `
    }
  ]
});
