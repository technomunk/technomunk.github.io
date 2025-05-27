import type { Grammar } from "./lexer";

import { NAME_RE, NUMBER_RE } from "./common";

export const ASM_GRAMMAR: Grammar = new Map([
    [/^[:,]/, "punctuation"],
    [/^;.*(?=\n|$)/, "comment"],
    [/^(mov|inc|mul|cmp|jb|ret)/, "keyword"],
    [NAME_RE, "name"],
    [NUMBER_RE, "value"],
])
