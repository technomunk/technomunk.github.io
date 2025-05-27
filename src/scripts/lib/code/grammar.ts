import type { Tag, Token } from './types';

export type PartialToken = {
	tag: Tag;
	hint?: string;
};

export interface Grammar {
	/** Whether the language is using words or individual characters */
	tokenUnit: 'word' | 'character';
	keywords: Map<string, PartialToken>;
	commentMarker: RegExp;
	tokenizer: (s: string) => Token | undefined;
	exprUnit: 'line' | 'character';
	extractLabelName: (s: string) => string;
}

export const GRAMMARS: { [lang: string]: Grammar } = {
	asm: {
		tokenUnit: 'word',
		keywords: new Map([
			['mov', { tag: 'keyword', hint: 'Copy a value' }],
			['inc', { tag: 'keyword', hint: 'Increment provided value' }],
			['mul', { tag: 'keyword', hint: 'Multiply 2 values together' }],
			['cmp', { tag: 'keyword', hint: 'Compare 2 values together and set the cmp register to the result' }],
			['jb', { tag: 'keyword', hint: 'Jump to the provided label if the tested value was below the compared one' }],
			['ret', { tag: 'keyword' }],
			['ax', { tag: 'var' }],
			['cx', { tag: 'var' }],
			['di', { tag: 'var' }],
		]),
		commentMarker: /;/,
		tokenizer: tokenizeAsm,
		exprUnit: 'line',
		extractLabelName: (s) => s.slice(0, -1),
	},
	bnfk: {
		tokenUnit: 'character',
		keywords: new Map([
			['+', { tag: 'keyword', hint: 'Increment active value' }],
			['-', { tag: 'keyword', hint: 'Decrement active value' }],
			['>', { tag: 'keyword', hint: 'Select next value' }],
			['<', { tag: 'keyword', hint: 'Select previous value' }],
			['.', { tag: 'ref', hint: 'Print the active value to the output' }],
			[',', { tag: 'ref', hint: 'Read a character from input into the active value' }],
			['[', { tag: 'scope', hint: 'Jump past the matching ] if the active value is 0' }],
			[']', { tag: 'scope', hint: 'Jump to the matching [ if the active value is not 0' }],
		]),
		commentMarker: /[^\s\+\-<>\.,\[\]]/,
		tokenizer: () => undefined,
		exprUnit: 'character',
		extractLabelName: (s) => s,
	},
};

function tokenizeAsm(s: string): Token | undefined {
	if (s.endsWith(':')) {
		return { tag: 'label', value: s, hint: 'Label that may be referenced by other code' };
	}
	if (Number.isNaN(Number.parseInt(s))) {
		return { tag: 'ref', value: s, hint: 'Reference to a previously defined label' };
	}
	return { tag: 'val', value: s, hint: 'A numerical value' };
}
