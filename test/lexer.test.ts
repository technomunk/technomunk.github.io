import { assert, expect, test } from 'vitest'

import { tokenize, type Token } from '../src/scripts/lib/code/lex/lexer'
import { ASM_GRAMMAR } from '../src/scripts/lib/code/lex/asm'
import { BNFK_GRAMMAR } from '../src/scripts/lib/code/lex/bnfk'

test("tokenize asm", () => {
    const src = `; this is a comment
some_label:
    mov  ax, 0
    inc  ax
    mul  ax, ax
    cmp  ax, di
    jb   some_label
    ret`
    const expected_tokens: Token[] = [
        // ; this is a comment
        { tag: "comment", pos: 0, len: 19 },
        // some_label:
        { tag: "name", pos: 20, len: 10 },
        { tag: "punctuation", pos: 30, len: 1 },
        // mov ax, 0
        { tag: "keyword", pos: 36, len: 3 },
        { tag: "name", pos: 41, len: 2 },
        { tag: "punctuation", pos: 43, len: 1 },
        { tag: "value", pos: 45, len: 1 },
        // inc ax
        { tag: "keyword", pos: 51, len: 3 },
        { tag: "name", pos: 56, len: 2 },
        // mul ax, ax
        { tag: "keyword", pos: 63, len: 3 },
        { tag: "name", pos: 68, len: 2 },
        { tag: "punctuation", pos: 70, len: 1 },
        { tag: "name", pos: 72, len: 2 },
        // cmp ax, di
        { tag: "keyword", pos: 79, len: 3 },
        { tag: "name", pos: 84, len: 2 },
        { tag: "punctuation", pos: 86, len: 1 },
        { tag: "name", pos: 88, len: 2 },
        // jb some_label
        { tag: "keyword", pos: 95, len: 2 },
        { tag: "name", pos: 100, len: 10 },
        // ret
        { tag: "keyword", pos: 115, len: 3 }
    ]

    const tokens = [...tokenize(src, ASM_GRAMMAR)]
    expect(tokens).toStrictEqual(expected_tokens)
})

test("tokenize bnfk", () => {
    const src = `+-,.[<>] This is a comment and ignores the <>
++`
    const expected_tokens: Token[] = [
        { tag: "keyword", pos: 0, len: 1 },
        { tag: "keyword", pos: 1, len: 1 },
        { tag: "keyword", pos: 2, len: 1 },
        { tag: "keyword", pos: 3, len: 1 },
        { tag: "punctuation", pos: 4, len: 1 },
        { tag: "keyword", pos: 5, len: 1 },
        { tag: "keyword", pos: 6, len: 1 },
        { tag: "punctuation", pos: 7, len: 1 },
        { tag: "comment", pos: 9, len: 36 },
        { tag: "keyword", pos: 46, len: 1 },
        { tag: "keyword", pos: 47, len: 1 },
    ]
    const tokens = [...tokenize(src, BNFK_GRAMMAR)]
    expect(tokens).toStrictEqual(expected_tokens)
})
