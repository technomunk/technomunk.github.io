import { ASM_GRAMMAR } from '@lib/code/lex/asm';
import { AST_GRAMMAR } from '@lib/code/lex/ast';
import { BNFK_GRAMMAR } from '@lib/code/lex/bnfk';
import { LISP_GRAMMAR } from '@lib/code/lex/lisp';
import { PY_GRAMMAR } from '@lib/code/lex/py';
import type { Grammar } from '@lib/code/lex/lexer';

import { assert, test } from 'vitest';

test.each([ASM_GRAMMAR, AST_GRAMMAR, BNFK_GRAMMAR, LISP_GRAMMAR, PY_GRAMMAR])(
	'RegExp is well formed',
	(grammar: Grammar) => {
		for (const key of grammar.keys()) {
			assert(key.source.startsWith('^'));
		}
	},
);
