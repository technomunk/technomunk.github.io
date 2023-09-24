import type { Tag } from "../lex/lexer";

type ParseOp = {}

const nodes: { [node: string]: ParseOp[] } = {
    functionDefinition: [
        exact('('),
        exact('defun'),
        token('name'),
        exact('('),
        maybeSeveral(token('name')),
        exact(')'),
        maybeOne(token('string')),
        recurse('expression'),
    ],
    expression: [
        exact('('),
        token(['name', 'keyword']),
        maybeSeveral(recurse('expression')),
    ]
}

function exact(match: string | string[]): ParseOp {
    return {}
}
function token(tag: Tag | Tag[]): ParseOp {
    return {}
}
function maybeOne(op: ParseOp | ParseOp[]): ParseOp {
    return {}
}
function maybeSeveral(op: ParseOp | ParseOp[]): ParseOp {
    return {}
}
function recurse(node: string | string[]): ParseOp {
    return {}
}
