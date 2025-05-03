import type { Grammar } from './lexer';

export const BNFK_GRAMMAR = new Map([
	[/^\s+/, 'whitespace'],
	[/^\w.*(?=$|\n)/, 'comment'],
	[/^[\+\-<>,\.]/, 'keyword'],
	[/^[\[\]]/, 'punctuation'],
]) as Grammar;
