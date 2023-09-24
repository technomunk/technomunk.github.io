import type { Grammar } from "./lexer";

export const BNFK_GRAMMAR: Grammar = new Map([
    [/^\s+/, "whitespace"],
    [/^\w.*(?=$|\n)/, "comment"],
    [/^[\+\-<>,\.]/, "keyword"],
    [/^[\[\]]/, "punctuation"],
])
