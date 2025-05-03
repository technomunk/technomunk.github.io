import type { Grammar } from "./lexer";

import { NUMBER_RE, OPERATOR_RE, STRING_RE } from "./common";

export const AST_GRAMMAR: Grammar = new Map([
    [/^(statement|expression|variable|value)/, "keyword"],
    [/^[\(\)\{\}:,\[\]]/, "punctuation"],
    [STRING_RE, "string"],
    [NUMBER_RE, "value"],
    [/^[a-zA-Z-]([a-zA-Z_\d ]+[a-zA-Z_])?/, "name"],
    [OPERATOR_RE, "name"],
])
