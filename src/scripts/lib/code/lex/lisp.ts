import { NAME_RE, NUMBER_RE, OPERATOR_RE, STRING_RE } from "./common";
import type { Grammar } from "./lexer";

export const LISP_GRAMMAR: Grammar = new Map([
    [/^[\(\)]/, "punctuation"],
    [/^(defun|if|read|write)/, "keyword"],
    [OPERATOR_RE, "keyword"],
    [STRING_RE, "string"],
    [NAME_RE, "name"],
    [NUMBER_RE, "value"],
])
