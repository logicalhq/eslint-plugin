'use strict';

var experimentalUtils = require('@typescript-eslint/experimental-utils');

var Punctuator;
(function (Punctuator) {
    Punctuator["OpenBrace"] = "{";
    Punctuator["CloseBrace"] = "}";
    Punctuator["OpenParen"] = "(";
    Punctuator["CloseParen"] = ")";
    Punctuator["OpenBracket"] = "[";
    Punctuator["CloseBracket"] = "]";
    Punctuator["Dot"] = ".";
    Punctuator["DotDotDot"] = "...";
    Punctuator["Semicolon"] = ";";
    Punctuator["Comma"] = ",";
    Punctuator["QuestionDot"] = "?.";
    Punctuator["LessThan"] = "<";
    Punctuator["LessThanSlash"] = "</";
    Punctuator["GreaterThan"] = ">";
    Punctuator["LessThanEquals"] = "<=";
    Punctuator["GreaterThanEquals"] = ">=";
    Punctuator["EqualsEquals"] = "==";
    Punctuator["ExclamationEquals"] = "!=";
    Punctuator["EqualsEqualsEquals"] = "===";
    Punctuator["ExclamationEqualsEquals"] = "!==";
    Punctuator["EqualsGreaterThan"] = "=>";
    Punctuator["Plus"] = "+";
    Punctuator["Minus"] = "-";
    Punctuator["Asterisk"] = "*";
    Punctuator["AsteriskAsterisk"] = "**";
    Punctuator["Slash"] = "/";
    Punctuator["Percent"] = "%";
    Punctuator["PlusPlus"] = "++";
    Punctuator["MinusMinus"] = "--";
    Punctuator["LessThanLessThan"] = "<<";
    Punctuator["GreaterThanGreaterThan"] = ">>";
    Punctuator["GreaterThanGreaterThanGreaterThan"] = ">>>";
    Punctuator["Ampersand"] = "&";
    Punctuator["Bar"] = "|";
    Punctuator["Caret"] = "^";
    Punctuator["Exclamation"] = "!";
    Punctuator["Tilde"] = "~";
    Punctuator["AmpersandAmpersand"] = "&&";
    Punctuator["BarBar"] = "||";
    Punctuator["Question"] = "?";
    Punctuator["Colon"] = " =";
    Punctuator["At"] = "@";
    Punctuator["QuestionQuestion"] = "??";
    Punctuator["Backtick"] = "`";
    Punctuator["Equals"] = "=";
    Punctuator["PlusEquals"] = "+=";
    Punctuator["MinusEquals"] = "-=";
    Punctuator["AsteriskEquals"] = "*=";
    Punctuator["AsteriskAsteriskEquals"] = "**=";
    Punctuator["SlashEquals"] = "/=";
    Punctuator["PercentEquals"] = "%=";
    Punctuator["LessThanLessThanEquals"] = "<<=";
    Punctuator["GreaterThanGreaterThanEquals"] = ">>=";
    Punctuator["GreaterThanGreaterThanGreaterThanEquals"] = ">>>=";
    Punctuator["AmpersandEquals"] = "&=";
    Punctuator["BarEquals"] = "|=";
    Punctuator["BarBarEquals"] = "||=";
    Punctuator["AmpersandAmpersandEquals"] = "&&=";
    Punctuator["QuestionQuestionEquals"] = "??=";
    Punctuator["CaretEquals"] = "^=";
})(Punctuator || (Punctuator = {}));
var Character;
(function (Character) {
    Character["Empty"] = "";
    Character["Formfeed"] = "\f";
    Character["Newline"] = "\n";
    Character["Tab"] = "\t";
    Character["VerticalTab"] = "\v";
    Character["Space"] = " ";
})(Character || (Character = {}));
var Trivia;
(function (Trivia) {
    Trivia["Comma"] = "Comma";
    Trivia["Empty"] = "Empty";
    Trivia["Formfeed"] = "Formfeed";
    Trivia["Garbage"] = "Garbage";
    Trivia["Newline"] = "Newline";
    Trivia["Space"] = "Space";
    Trivia["Semicolon"] = "Semicolon";
    Trivia["Tab"] = "Tab";
    Trivia["VerticalTab"] = "VerticalTab";
})(Trivia || (Trivia = {}));
const PATTERNS = {
    newline: /(\r?\n|[\r\n\u2028\u2029])/,
    space: /^(\s+)$/
};

var SpecifierPosition;
(function (SpecifierPosition) {
    SpecifierPosition["Before"] = "before";
    SpecifierPosition["After"] = "after";
})(SpecifierPosition || (SpecifierPosition = {}));
class Specifier {
    position = SpecifierPosition.Before;
    before = [];
    after = [];
    tokens = [];
    node;
    hasComma = false;
}

// https://github.com/tc39/proposal-array-find-from-last
function findLastIndex(array, callbackFn) {
    for (let idx = array.length - 1; idx >= 0; idx--) {
        if (callbackFn(array[idx], idx, array))
            return idx;
    }
    return -1;
}

function obtainLastLine({ node, idx, chunk }) {
    if (idx === 0)
        return node.loc.start.line - 1;
    return chunk[idx - 1].loc.end.line;
}
function obtainCommentsBefore({ node, idx, sourceCode, lastLine }) {
    return sourceCode
        .getCommentsBefore(node)
        .filter((comment) => {
        return (comment.loc.start.line <= node.loc.start.line &&
            comment.loc.end.line > lastLine &&
            (idx > 0 || comment.loc.start.line > lastLine));
    });
}
function obtainCommentsAfter({ node, sourceCode }) {
    return sourceCode
        .getCommentsAfter(node)
        .filter((comment) => comment.loc.end.line === node.loc.end.line);
}
function obtainIndentation({ node, sourceCode }) {
    const tokenBefore = sourceCode.getTokenBefore(node, {
        includeComments: true
    });
    const lines = sourceCode.text
        .slice(tokenBefore === null ? 0 : tokenBefore.range[1], node.range[0])
        .split(PATTERNS.newline);
    if (tokenBefore === null)
        return lines.at(-1);
    return lines.length > 1 ? lines.at(-1) : Character.Empty;
}
function requiresHeadNewline(tokens) {
    const filtered = tokens.filter(token => token.type !== Trivia.Space);
    if (!filtered.length)
        return false;
    const [firstToken] = filtered;
    return (firstToken.type === experimentalUtils.TSESTree.AST_TOKEN_TYPES.Line ||
        (firstToken.type === experimentalUtils.TSESTree.AST_TOKEN_TYPES.Block &&
            PATTERNS.newline.test(firstToken.value)));
}

const TAIL_MAX_SEQUENCE = 5;
function tokenizeTrivia(str) {
    let substrings = str.split(PATTERNS.newline);
    substrings =
        substrings.length >= TAIL_MAX_SEQUENCE
            ? substrings.slice(0, 2).concat(substrings.slice(-1))
            : substrings;
    return substrings
        .map((value) => {
        if (value.length === 0) {
            return { type: Trivia.Empty, value: Character.Empty };
        }
        else if (PATTERNS.newline.test(value)) {
            return { type: Trivia.Newline, value: Character.Newline };
        }
        else if (value === Punctuator.Comma) {
            return { type: Trivia.Comma, value };
        }
        else if (PATTERNS.space.test(value)) {
            return {
                type: Trivia.Space,
                value,
                occurences: value.length
            };
        }
        return { type: Trivia.Garbage, value };
    })
        .filter(token => token.type !== Trivia.Garbage && token.type !== Trivia.Empty);
}
function tokenize({ node, sourceCode }) {
    return sourceCode
        .getTokens(node)
        .flatMap((token, idx, tokens) => {
        if (idx === tokens.length - 1)
            return [token];
        const comments = sourceCode.getCommentsAfter(token);
        const last = comments.length > 0 ? comments.at(-1) : token;
        const nextToken = tokens[idx + 1];
        return [
            token,
            ...comments.flatMap((comment, cidx) => {
                const sibling = cidx === 0 ? token : comments[cidx - 1];
                return [
                    ...tokenizeTrivia(sourceCode.text.slice(sibling.range[1], comment.range[0])),
                    {
                        ...comment,
                        value: sourceCode.text.slice(comment.range[0], comment.range[1])
                    }
                ];
            }),
            ...tokenizeTrivia(sourceCode.text.slice(last.range[1], nextToken.range[0]))
        ];
    });
}

var CommentPosition;
(function (CommentPosition) {
    CommentPosition["Before"] = "before";
    CommentPosition["After"] = "after";
})(CommentPosition || (CommentPosition = {}));
function renderComment({ comment, sourceCode, trivia, position }) {
    const text = sourceCode.text.slice(comment.range[0], comment.range[1]);
    return position === CommentPosition.Before
        ? text.concat(tokenizeTrivia(trivia)
            .map(token => token.value)
            .join(Character.Empty))
        : tokenizeTrivia(trivia)
            .map(token => token.value)
            .join(Character.Empty)
            .concat(text);
}
function renderComments({ node, sourceCode, comments, position }) {
    return comments
        .map((comment, idx) => {
        let trivia;
        switch (position) {
            case CommentPosition.Before:
                trivia = sourceCode.text.slice(comment.range[1], (idx === comments.length - 1 ? node : comments[idx + 1]).range[0]);
                break;
            default:
                trivia = sourceCode.text.slice((idx === 0 ? node : comments[idx - 1]).range[1], comment.range[0]);
                break;
        }
        return renderComment({ comment, sourceCode, trivia, position });
    })
        .join(Character.Empty);
}

//
// From: https://tc39.es/ecma262/multipage/ecmascript-language-scripts-and-modules.html#prod-ImportDeclaration
//
// ▽─ ─ ─ ─ ─ ─ ─ Import Declaration ─ ─ ─ ─ ─ ─ ─ ─▽
// ▽─ ─ ─ ─ Import Clause ─ ─ ─ ─▽ ▽─ From Clause- ─▽
//          ▽─ ─ Imports List ─ ─▽
//                  ▼ Specifier ▼
// ┌────────────────────────────────────────────────┐
// │ import { lexer, tree as AST } from 'carthage'; │
// └────────────────────────────────────────────────┘
//     ▼─ Identifier ─▼     ▽ ─ ─ ─ ─ Binding ─ ─ ─ ─ ▽
// ┌─────────────────────────────────────────────────────┐
// │ { ImportDeclaration as AugmentedImportDeclaration } │
// └─────────────────────────────────────────────────────┘
//          ▼▼▼▼▼▼▼▼▼ SpecifierTokens  ▼ TriviaTokens
// ┌─────────────────────────────────────┐
// │ import { lexer } from 'carthage';\n │
// └─────────────────────────────────────┘
//
class AugmentedImportDeclaration {
    options;
    _braceTokenRange;
    _importSpecifiers;
    _value;
    _tokens;
    _importSpecifierTokens;
    _specifiersState = {
        before: [],
        after: [],
        identifiers: []
    };
    _segments;
    constructor(options) {
        this.options = options;
    }
    get node() {
        return this.options.node;
    }
    get sourceCode() {
        return this.options.sourceCode;
    }
    get idx() {
        return this.options.idx;
    }
    get source() {
        return (this.node.source.value ??
            this.node.source.name);
    }
    get segments() {
        const { node, idx, sourceCode, chunk } = this.options;
        return (this._segments ??= {
            commentsBefore: obtainCommentsBefore({
                node,
                idx,
                sourceCode,
                lastLine: obtainLastLine({
                    node,
                    idx,
                    chunk
                })
            }),
            commentsAfter: obtainCommentsAfter({
                node,
                sourceCode
            }),
            indentation: obtainIndentation({
                node,
                sourceCode
            })
        });
    }
    get tokens() {
        const { node, sourceCode } = this;
        return (this._tokens ??= tokenize({ node, sourceCode }));
    }
    get importClauses() {
        return this.node.specifiers;
    }
    get importSpecifiers() {
        return (this._importSpecifiers ??= this.importClauses.filter(clause => clause.type === experimentalUtils.TSESTree.AST_NODE_TYPES.ImportSpecifier));
    }
    get braceTokenRange() {
        return (this._braceTokenRange ??= [
            this.tokens.findIndex(token => token.type === experimentalUtils.TSESTree.AST_TOKEN_TYPES.Punctuator &&
                token.value === Punctuator.OpenBrace),
            this.tokens.findIndex(token => token.type === experimentalUtils.TSESTree.AST_TOKEN_TYPES.Punctuator &&
                token.value === Punctuator.CloseBrace)
        ]);
    }
    get importSpecifierTokens() {
        return this.tokens.slice(this.braceTokenRange[0] + 1, this.braceTokenRange[1]);
    }
    get specifiersState() {
        if (this._specifiersState.identifiers.length) {
            return this._specifiersState;
        }
        let specifier = new Specifier();
        this.importSpecifierTokens.forEach(token => {
            switch (specifier.position) {
                case SpecifierPosition.Before:
                    specifier = this.handleBeforeIdentifier(specifier, token);
                    break;
                case SpecifierPosition.After:
                    specifier = this.handleAfterIdentifier(specifier, token);
                    break;
                default:
                    this.handleIdentifier(specifier, token);
            }
        });
        this.handleLastSpecifier(specifier);
        this._specifiersState.identifiers = this.updateIdentifierNodes(this._specifiersState.identifiers);
        return this._specifiersState;
    }
    hasSpecifiers() {
        return (!this.braceTokenRange.includes(-1) && this.importSpecifiers.length >= 1);
    }
    isSideEffect() {
        return (!this.importClauses.length &&
            (!this.node.importKind || this.node.importKind === 'value') &&
            this.sourceCode.getFirstToken(this.node, { skip: 1 })?.value !==
                Punctuator.OpenBrace);
    }
    renderTokens() {
        const lastToken = this.tokens[this.tokens.length - 1];
        const hasSemicolon = lastToken &&
            lastToken.type === experimentalUtils.TSESTree.AST_TOKEN_TYPES.Punctuator &&
            lastToken.value === Punctuator.Semicolon;
        const tokens = hasSemicolon
            ? this.tokens
            : [
                ...this.tokens,
                { type: Trivia.Semicolon, value: Punctuator.Semicolon }
            ];
        return tokens.map(token => token.value).join(Character.Empty);
    }
    renderNode() {
        if (!this.hasSpecifiers())
            return this.renderTokens();
        const lastSpecifierToken = this.sourceCode.getTokenBefore(this.tokens[this.braceTokenRange[1]]);
        const hasTrailingComma = lastSpecifierToken?.type === experimentalUtils.TSESTree.AST_TOKEN_TYPES.Punctuator &&
            lastSpecifierToken.value === Punctuator.Comma;
        const { identifiers, before: beforeIdentifiers, after: afterIdentifiers } = this.specifiersState;
        const sortedIdentifiers = this.options.strategy
            .sortIdentifiers(identifiers)
            .flatMap((identifier, idx, array) => {
            const previous = array[idx - 1];
            const headNewline = previous &&
                requiresHeadNewline(identifier.before) &&
                !(previous.after.length &&
                    previous.after[previous.after.length - 1].type === Trivia.Newline)
                ? [{ type: Trivia.Newline, value: Character.Newline }]
                : [];
            if (identifiers.findIndex(id => id === identifier) === 0 &&
                requiresHeadNewline(beforeIdentifiers)) {
                headNewline.push({ type: Trivia.Newline, value: Character.Newline });
            }
            let after = requiresHeadNewline(beforeIdentifiers)
                ? identifier.after.filter(id => id.type !== Trivia.Space).length
                    ? identifier.after
                    : []
                : identifier.after;
            if (identifier.hasComma) {
                const nonblankPredicate = (token) => token.type !== Trivia.Newline && token.type !== Trivia.Space;
                let firstNonblankIdx = idx < array.length - 1 || hasTrailingComma
                    ? -1
                    : after.findIndex(nonblankPredicate);
                firstNonblankIdx = firstNonblankIdx === -1 ? 0 : firstNonblankIdx;
                const lastNonblankIdx = findLastIndex(after, nonblankPredicate);
                if (lastNonblankIdx === -1) {
                    after = after.slice(firstNonblankIdx);
                }
                else if (after
                    .slice(lastNonblankIdx + 1)
                    .filter(token => token.type !== Trivia.Space).length) {
                    after = after.slice(firstNonblankIdx);
                }
                else {
                    after = after.slice(firstNonblankIdx, lastNonblankIdx + 1);
                }
            }
            return [
                ...headNewline,
                ...identifier.before,
                ...identifier.tokens,
                ...(idx < array.length - 1 || hasTrailingComma
                    ? [{ type: Trivia.Comma, value: Punctuator.Comma }]
                    : []),
                ...after
            ];
        });
        const tokens = [
            ...this.tokens.slice(0, this.braceTokenRange[0] + 1),
            ...beforeIdentifiers,
            ...sortedIdentifiers,
            ...(requiresHeadNewline(afterIdentifiers) &&
                sortedIdentifiers[sortedIdentifiers.length - 1].type !== Trivia.Newline
                ? [{ type: Trivia.Newline, value: Character.Newline }]
                : []),
            ...afterIdentifiers,
            ...this.tokens.slice(this.braceTokenRange[1])
        ];
        const lastToken = tokens[tokens.length - 1];
        const hasSemicolon = lastToken.type === experimentalUtils.TSESTree.AST_TOKEN_TYPES.Punctuator &&
            lastToken.value === Punctuator.Semicolon;
        if (!hasSemicolon) {
            tokens.push({
                type: Trivia.Semicolon,
                value: Punctuator.Semicolon
            });
        }
        return tokens.map(token => token.value).join(Character.Empty);
    }
    toString() {
        const { node, sourceCode } = this;
        const { indentation } = this.segments;
        return (this._value ??= String().concat(indentation, renderComments({
            node,
            sourceCode,
            comments: this.segments.commentsBefore,
            position: CommentPosition.Before
        }), this.renderNode(), renderComments({
            node,
            sourceCode,
            comments: this.segments.commentsAfter,
            position: CommentPosition.After
        })));
    }
    handleBeforeIdentifier(specifier, token) {
        switch (token.type) {
            case Trivia.Newline:
                specifier.before.push(token);
                if (!this._specifiersState.before.length &&
                    !this._specifiersState.identifiers.length) {
                    this._specifiersState.before = specifier.before;
                    specifier = new Specifier();
                }
                break;
            case Trivia.Space:
            case experimentalUtils.TSESTree.AST_TOKEN_TYPES.Block:
            case experimentalUtils.TSESTree.AST_TOKEN_TYPES.Line:
                specifier.before.push(token);
                break;
            case experimentalUtils.TSESTree.AST_TOKEN_TYPES.Identifier:
                if (!this._specifiersState.before.length &&
                    !this._specifiersState.identifiers.length) {
                    this._specifiersState.before = specifier.before;
                    specifier = new Specifier();
                }
                specifier.position = undefined;
                specifier.tokens.push(token);
        }
        return specifier;
    }
    handleAfterIdentifier(specifier, token) {
        switch (token.type) {
            case Trivia.Newline:
                specifier.after.push(token);
                this._specifiersState.identifiers.push(specifier);
                specifier = new Specifier();
                break;
            case Trivia.Space:
            case experimentalUtils.TSESTree.AST_TOKEN_TYPES.Line:
                specifier.after.push(token);
                break;
            case experimentalUtils.TSESTree.AST_TOKEN_TYPES.Block:
                if (PATTERNS.newline.test(token.value)) {
                    this._specifiersState.identifiers.push(specifier);
                    specifier = new Specifier();
                    specifier.before.push(token);
                }
                else {
                    specifier.after.push(token);
                }
                break;
            case experimentalUtils.TSESTree.AST_TOKEN_TYPES.Identifier:
                this._specifiersState.identifiers.push(specifier);
                specifier = new Specifier();
                specifier.position = undefined;
                specifier.tokens.push(token);
                break;
        }
        return specifier;
    }
    handleIdentifier(specifier, token) {
        switch (token.type) {
            case experimentalUtils.TSESTree.AST_TOKEN_TYPES.Punctuator:
                if (token.value === Punctuator.Comma) {
                    specifier.hasComma = true;
                    specifier.position = SpecifierPosition.After;
                }
                break;
            default:
                specifier.tokens.push(token);
        }
    }
    handleLastSpecifier(specifier) {
        switch (specifier.position) {
            case SpecifierPosition.Before:
                this._specifiersState.after = specifier.before;
                break;
            case SpecifierPosition.After:
                if (specifier.after.at(-1)?.type === Trivia.Space) {
                    this._specifiersState.after = [
                        specifier.after.pop()
                    ];
                }
                this._specifiersState.identifiers.push(specifier);
                break;
            default:
                const lastIdentifierIdx = findLastIndex(specifier.tokens, token => token.type === experimentalUtils.TSESTree.AST_TOKEN_TYPES.Identifier ||
                    token.type === experimentalUtils.TSESTree.AST_TOKEN_TYPES.Keyword);
                const tokens = specifier.tokens.slice(0, lastIdentifierIdx + 1);
                const after = specifier.tokens.slice(lastIdentifierIdx + 1);
                let newlineIdx = after.findIndex(t => t.type === Trivia.Newline);
                if (newlineIdx !== -1)
                    newlineIdx += 1;
                const blockIdx = after.findIndex(t => t.type === experimentalUtils.TSESTree.AST_TOKEN_TYPES.Block &&
                    PATTERNS.newline.test(t.value));
                let sliceIdx = -1;
                if (newlineIdx >= 0 && blockIdx >= 0) {
                    sliceIdx = Math.min(newlineIdx, blockIdx);
                }
                else if (newlineIdx >= 0) {
                    sliceIdx = newlineIdx;
                }
                else if (blockIdx >= 0) {
                    sliceIdx = blockIdx;
                }
                else if (after.at(-1)?.type === Trivia.Space) {
                    sliceIdx = after.length;
                }
                specifier.tokens = tokens;
                specifier.after = sliceIdx === -1 ? after : after.slice(0, sliceIdx);
                this._specifiersState.identifiers.push(specifier);
                this._specifiersState.after =
                    sliceIdx === -1 ? [] : after.slice(sliceIdx);
        }
    }
    updateIdentifierNodes(identifiers) {
        return identifiers.map((identifier, idx) => {
            identifier.node = this.importSpecifiers[idx];
            return identifier;
        });
    }
}

function compareString(x, y) {
    const result = new Intl.Collator('en', {
        sensitivity: 'base',
        numeric: true
    }).compare(x, y);
    if (result !== 0)
        return result;
    return x === y ? 0 : x < y ? -1 : 1;
}

/* istanbul ignore next */
const builtin = [
    'assert',
    'async_hooks',
    'buffer',
    'child_process',
    'cluster',
    'console',
    'constants',
    'crypto',
    'dgram',
    'dns',
    'domain',
    'events',
    'fs',
    'http',
    'http2',
    'https',
    'inspector',
    'module',
    'net',
    'os',
    'path',
    'perf_hooks',
    'process',
    'punycode',
    'querystring',
    'readline',
    'repl',
    'stream',
    'string_decoder',
    'timers',
    'tls',
    'trace_events',
    'tty',
    'url',
    'util',
    'v8',
    'vm',
    'wasi',
    'worker_threads',
    'zlib'
];
class LogicalStrategy {
    options;
    constructor(options) {
        this.options = options;
    }
    get scopes() {
        return this.options.scopes ?? [];
    }
    hasScope(source) {
        return this.scopes.map(scope => source.startsWith(scope)).includes(true);
    }
    renderImports(declarations) {
        const rendered = Object.fromEntries(Object.entries(this.groupDeclarations(declarations)).map(([name, group]) => {
            const sorted = this.sortDeclarations(group);
            const requiresNewline = !group.at(-1)?.segments.commentsAfter.length &&
                sorted.at(-1)?.segments.commentsAfter.length;
            const declarations = group.length
                ? sorted
                    .map(declaration => declaration.toString())
                    .join(Character.Newline)
                    .concat(requiresNewline ? Character.Newline : Character.Empty)
                : Character.Empty;
            return [name, declarations];
        }));
        return String().concat(rendered.builtin, rendered.builtin.length && rendered.vendor.length
            ? Character.Newline
            : Character.Empty, rendered.vendor, (rendered.builtin.length || rendered.vendor.length) &&
            rendered.local.length
            ? Character.Newline.repeat(2)
            : Character.Empty, rendered.local);
    }
    groupDeclarations(declarations) {
        const groups = {
            builtin: [],
            vendor: [],
            local: []
        };
        for (const declaration of declarations) {
            switch (declaration.node.importKind) {
                case 'type':
                case 'value':
                    const source = declaration.node.source.value;
                    if (builtin.includes(source)) {
                        groups.builtin.push(declaration);
                    }
                    else if (source.charAt(0) === Punctuator.Dot ||
                        this.hasScope(source)) {
                        groups.local.push(declaration);
                    }
                    else {
                        groups.vendor.push(declaration);
                    }
                    break;
            }
        }
        return groups;
    }
    sortIdentifiers(identifiers) {
        return identifiers
            .slice()
            .sort(({ node: a }, { node: b }) => compareString(a.imported?.name, b.imported?.name) ||
            compareString(a.local?.name, b.local?.name));
    }
    sortDeclarations(declarations) {
        return declarations.slice().sort((a, b) => {
            if (a.isSideEffect() || b.isSideEffect()) {
                return this.compareSideEffects(a, b);
            }
            else if (this.hasScope(a.source) || this.hasScope(b.source)) {
                return this.compareScopes(a, b);
            }
            else if (a.hasSpecifiers() || b.hasSpecifiers()) {
                return this.compareSpecifiers(a, b);
            }
            const result = this.compareDeclarationSource(a, b);
            return result === 0 ? a.idx - b.idx : result;
        });
    }
    compareSideEffects(a, b) {
        let result = this.compareDeclaration(a, b, declaration => declaration.isSideEffect());
        if (result !== 0)
            return result;
        result = this.compareDeclarationSource(a, b);
        return result === 0 ? a.idx - b.idx : result;
    }
    compareScopes(a, b) {
        const pos = {
            a: findLastIndex(this.scopes, scope => a.source.startsWith(scope)),
            b: findLastIndex(this.scopes, scope => b.source.startsWith(scope))
        };
        if (pos.a === pos.b) {
            const result = this.compareDeclarationSource(a, b);
            return result === 0 ? a.idx - b.idx : result;
        }
        return pos.a < pos.b ? -1 : 1;
    }
    compareSpecifiers(a, b) {
        let result = this.compareDeclarationSource(a, b);
        if (result !== 0)
            return result;
        result = this.compareDeclaration(a, b, declaration => declaration.hasSpecifiers());
        if (result !== 0)
            return result;
        return a.idx - b.idx;
    }
    compareDeclaration(a, b, condition) {
        if (condition(a) && condition(b))
            return 0;
        return condition(a) ? 1 : -1;
    }
    compareDeclarationSource(a, b) {
        if (a.source.charAt(0) === Punctuator.At &&
            b.source.charAt(0) !== Punctuator.At) {
            return 1;
        }
        if (a.source.charAt(0) !== Punctuator.At &&
            b.source.charAt(0) === Punctuator.At) {
            return -1;
        }
        return compareString(a.source, b.source);
    }
}

var version = "1.1.2";

const createRule = experimentalUtils.ESLintUtils.RuleCreator((name) => `https://github.com/logicalhq/eslint-plugin/blob/v${version}/lib/rules/${name}.md`);

// A rule that sorts the imports by following an imports strategy.
const DefaultStrategy = 'logical';
const Strategies = new Map([
    ['logical', LogicalStrategy]
]);
function extractChunks(program) {
    const chunks = [];
    let currentChunk = [];
    for (const node of program.body) {
        if (node.type === experimentalUtils.TSESTree.AST_NODE_TYPES.ImportDeclaration) {
            currentChunk.push(node);
        }
        else if (currentChunk.length) {
            chunks.push(currentChunk);
            currentChunk = [];
        }
    }
    if (currentChunk.length) {
        chunks.push(currentChunk);
    }
    return chunks;
}
function inspect(chunk, { program, context, strategy: strategyName, scopes }) {
    if (!strategyName) {
        throw new Error(`Cannot find "${strategyName}" strategy, available strategies: ${[
            ...Strategies.keys()
        ].join(Punctuator.Semicolon)}.`);
    }
    const StrategyClass = Strategies.get(strategyName);
    if (!StrategyClass) {
        throw new Error(`No associated constructor associated with ${strategyName} strategy.`);
    }
    const strategy = new StrategyClass({ scopes });
    if (!strategy.renderImports || !strategy.sortIdentifiers) {
        throw new Error(`Strategy "${strategyName}" doesn't implement the ImportsStrategy interface.`);
    }
    if (!chunk.length) {
        return;
    }
    const sourceCode = context.getSourceCode();
    const declarations = chunk.map((node, idx) => new AugmentedImportDeclaration({
        node,
        idx,
        sourceCode,
        chunk,
        strategy
    }));
    let [start] = chunk[0].range;
    let [, end] = chunk.at(-1).range;
    for (const comment of program.comments ?? []) {
        const [cstart, cend] = comment.range;
        switch (comment.type) {
            case experimentalUtils.TSESTree.AST_TOKEN_TYPES.Block:
                if (comment.loc.start.line ===
                    chunk.at(-1).loc.start.line) {
                    start = cstart < start ? cstart : start;
                }
                if (comment.loc.end.line === comment.loc.start.line &&
                    comment.loc.end.line ===
                        chunk.at(-1).loc.end.line) {
                    end = cend > end ? cend : end;
                }
                break;
            case experimentalUtils.TSESTree.AST_TOKEN_TYPES.Line:
                if (comment.loc.end.line !==
                    chunk.at(-1).loc.end.line) {
                    continue;
                }
                end = cend > end ? cend : end;
                break;
        }
    }
    const sorted = strategy.renderImports(declarations);
    if (sourceCode.getText().slice(start, end) === sorted) {
        return;
    }
    context.report({
        messageId: 'imports',
        loc: {
            start: sourceCode.getLocFromIndex(start),
            end: sourceCode.getLocFromIndex(end)
        },
        fix: fixer => fixer.replaceTextRange([start, end], sorted)
    });
}
var imports = createRule({
    name: 'imports',
    meta: {
        type: 'layout',
        docs: {
            description: 'Enforces a consistent imports order.',
            recommended: false
        },
        fixable: 'code',
        schema: {
            type: 'array',
            definitions: {
                strategy: {
                    enum: [...Strategies.keys()]
                }
            },
            items: [
                {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        strategy: {
                            description: `Strategy used to sort imports (available: ${[
                                ...Strategies.keys()
                            ].join(',')}).`,
                            oneOf: [{ $ref: '#/definitions/strategy' }, { type: 'object' }]
                        },
                        scopes: {}
                    }
                }
            ]
        },
        messages: {
            imports: `Import order is inconsistent (use --fix to re-order).`
        }
    },
    defaultOptions: [
        {
            strategy: DefaultStrategy,
            scopes: []
        }
    ],
    create(context, [options]) {
        return {
            Program: (program) => {
                for (const chunk of extractChunks(program)) {
                    inspect(chunk, { program, context, ...options });
                }
            }
        };
    }
});

var rules = {
    imports
};

var index = {
    rules
};

module.exports = index;
//# sourceMappingURL=index.js.map
