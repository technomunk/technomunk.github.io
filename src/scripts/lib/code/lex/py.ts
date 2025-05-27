import { NAME_RE, NUMBER_RE, OPERATOR_RE } from './common';
import type { Grammar } from './lexer';

export const PY_GRAMMAR: Grammar = new Map([
	[/^[\(\):]/, 'punctuation'],
	[/^(def|if|print|input|int|return)/, 'keyword'],
	[OPERATOR_RE, 'keyword'],
	[/^"""[^"]*"""/, 'string'],
	[NAME_RE, 'name'],
	[NUMBER_RE, 'value'],
]);
