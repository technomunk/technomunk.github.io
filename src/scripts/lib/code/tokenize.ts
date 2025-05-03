import type { Lang, Token } from './types';

import { lines } from '../util';
import { GRAMMARS, type Grammar } from './grammar';

export function* tokenize(text: string, languageOrGrammar: Grammar | Lang): Generator<Token | string> {
	const grammar = typeof languageOrGrammar === 'string' ? GRAMMARS[languageOrGrammar] : languageOrGrammar;

	for (const line of lines(text)) {
		yield* tokenizeLine(line, grammar);
	}
}

export function* tokenizeLine(line: string, grammar: Grammar): Generator<Token | string> {
	const commentStart = line.search(grammar.commentMarker);
	let comment = '';
	if (commentStart !== -1) {
		comment = line.slice(commentStart);
		line = line.slice(0, commentStart);
	}

	switch (grammar.tokenUnit) {
		case 'character': {
			for (let i = 0; i < line.length; ++i) {
				const ch = line[i];
				const token = grammar.keywords.get(ch);
				if (token) {
					yield { value: ch, ...token };
				} else {
					yield grammar.tokenizer(ch) || ch;
				}
			}
			break;
		}
		case 'word': {
			let lastEnd = 0;
			for (const [start, end] of words(line)) {
				if (lastEnd < start) {
					yield line.slice(lastEnd, start);
				}
				lastEnd = end;
				const word = line.slice(start, end);
				const token = grammar.keywords.get(word);
				if (token) {
					yield { value: word, ...token };
				} else {
					yield grammar.tokenizer(word) || word;
				}
			}
			break;
		}
	}

	if (comment.length) {
		yield { tag: 'comment', value: comment, hint: 'A comment' };
	}
}

function* words(line: string): Generator<[number, number]> {
	let start = 0;
	for (let i = 0; i < line.length; ++i) {
		if ([' ', ','].indexOf(line.charAt(i)) !== -1) {
			if (start < i) {
				yield [start, i];
			}
			start = i + 1;
		}
	}
	if (start !== line.length) {
		yield [start, line.length];
	}
}

export function isToken(t: string | Token): t is Token {
	return typeof t !== 'string';
}

export function isExprComponent(t: string | Token): boolean {
	return isToken(t) && t.tag !== 'comment' && t.tag !== 'label';
}
