import { lines } from '../util';
import { GRAMMARS, type Grammar } from './grammar';
import { isExprComponent, tokenizeLine } from './tokenize';
import type { Lang, Tag, Token } from './types';

const CLASS_MAP: { [tag in Tag]: string } = {
	comment: 's-cmt',
	keyword: 's-kwd',
	label: 's-lbl',
	ref: 's-ref',
	scope: 's-scp',
	val: 's-val',
	var: 's-var',
};

/** Convert a piece of code into HTML with tagged strings */
export function markSemanticsWithSpans(text: string, grammarOrLang: Grammar | Lang): string {
	const grammar = typeof grammarOrLang === 'string' ? GRAMMARS[grammarOrLang] : grammarOrLang;
	const result = [];

	for (const line of lines(text)) {
		const lineParts = [];
		let containsExpr = false;
		for (const token of tokenizeLine(line, grammar)) {
			containsExpr = containsExpr || (grammar.exprUnit === 'line' && isExprComponent(token));
			lineParts.push(intoSpan(token, grammar));
		}
		let newLine = lineParts.join('');
		if (containsExpr) {
			newLine = `<span class="expr" data-is-expr="">${newLine}</span>`;
		}
		result.push(newLine);
	}

	return result.join('\n');
}

function intoSpan(token: string | Token, grammar: Grammar): string {
	if (typeof token === 'string') {
		return token;
	}
	const attrs = new Map<string, string | null>([['class', CLASS_MAP[token.tag]]]);
	if (token.hint) {
		attrs.set('title', token.hint);
	}
	switch (token.tag) {
		case 'label':
			attrs.set('data-is-lbl', null);
			break;
		case 'var':
			attrs.set('data-is-var', null);
			break;
	}
	if (grammar.exprUnit === 'character' && token.tag !== 'comment' && token.tag !== 'label') {
		attrs.set('data-is-expr', null);
	}

	return `<span ${serializeAttrs(attrs)}>${token.value}</span>`;
}

function serializeAttrs(attrs: Map<string, string | null>): string {
	const result = [];
	for (const [name, value] of attrs.entries()) {
		result.push(value ? `${name}="${value}"` : name);
	}
	return result.join(' ');
}
