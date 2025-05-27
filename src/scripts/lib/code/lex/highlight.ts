import type { Tag } from './lexer';

import { ASM_GRAMMAR } from './asm';
import { AST_GRAMMAR } from './ast';
import { BNFK_GRAMMAR } from './bnfk';
import { tokenize } from './lexer';
import { LISP_GRAMMAR } from './lisp';
import { PY_GRAMMAR } from './py';

const GRAMMARS = {
	asm: ASM_GRAMMAR,
	bnfk: BNFK_GRAMMAR,
	lisp: LISP_GRAMMAR,
	py: PY_GRAMMAR,
	ast: AST_GRAMMAR,
};

const SHORT_TOKENS = {
	comment: 'cmt',
	keyword: 'kwd',
	name: 'lbl',
	punctuation: 'pnc',
	string: 'str',
	value: 'val',
} satisfies Record<Tag, string>;

export type Language = keyof typeof GRAMMARS;

export function highlightTokens(text: string, language: Language): string {
	const result: string[] = [];
	let lastPos = 0;
	for (const token of tokenize(text, GRAMMARS[language])) {
		if (token.pos > lastPos) {
			result.push(text.slice(lastPos, token.pos));
		}
		lastPos = token.pos + token.len;
		result.push(
			`<span class="s-${SHORT_TOKENS[token.tag]}">${text.slice(token.pos, token.pos + token.len)}</span>`,
		);
	}
	return result.join('');
}
