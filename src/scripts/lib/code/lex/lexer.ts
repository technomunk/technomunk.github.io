export type Tag = 'comment' | 'name' | 'keyword' | 'value' | 'punctuation' | 'string';

export type Token<TTag extends Tag = Tag> = {
	tag: TTag;
	/** Position of the start of the token in the source code */
	pos: number;
	/** The length of the corresponding string for the token in the source code */
	len: number;
};

/** Mapping of regular expressions to the token signature. Note that regular expressions should always expect to match from the start of the string! */
export type Grammar<TTag extends Tag = Tag> = Map<RegExp, TTag>;

export interface TokenizationOptions<_TTag> {
	whitespace?: RegExp;
}

export const DEFAULT_WHITESPACE = /^\s+/;

export class TokenizationError extends Error {
	text: string;
	offset: number;

	constructor(text: string, offset: number) {
		super(`No candidate found at ${offset}:\n${TokenizationError.formatErrorText(text, offset)}`); // TODO: inject line
		this.text = text;
		this.offset = offset;
	}

	static formatErrorText(text: string, offset: number): string {
		let start = text.lastIndexOf('\n', offset);
		if (start === -1) {
			start = 0;
		}
		const errorLineEnd = text.indexOf('\n', offset);
		if (errorLineEnd === -1) {
			return `${text.slice(start)}\n${' '.repeat(offset - start)}^`;
		}
		let nextLineEnd: number | undefined = text.indexOf('\n', errorLineEnd);
		if (nextLineEnd === -1) {
			nextLineEnd = undefined;
		}
		return `${text.slice(start, errorLineEnd)}\n${' '.repeat(offset - start)}^\n${text.slice(errorLineEnd + 1, nextLineEnd)}`;
	}
}

export function* tokenize<TTag extends Tag = Tag>(
	text: string,
	grammar: Grammar<TTag>,
	options: TokenizationOptions<TTag> = {},
): Generator<Token<TTag>> {
	const originalText = text;
	const whitespace = options.whitespace || DEFAULT_WHITESPACE;
	let offset = 0;
	while (text.length > 0) {
		const whitespaceLen = text.match(whitespace)?.[0].length || 0;
		if (whitespaceLen > 0) {
			offset += whitespaceLen;
			text = text.slice(whitespaceLen);
		}

		if (text.length === 0) {
			return;
		}

		const candidate = matchCandidate(text, grammar);
		if (candidate === undefined) {
			throw new TokenizationError(originalText, offset);
		}
		yield { pos: offset, ...candidate };
		text = text.slice(candidate.len);
		offset += candidate.len;
	}
}

function matchCandidate<TTag extends Tag>(
	text: string,
	grammar: Grammar<TTag>,
): { tag: TTag; len: number } | undefined {
	let len = 0;
	let tag: TTag | undefined = undefined;

	for (const [re, sig] of grammar.entries()) {
		const match = text.match(re);
		if (match) {
			const candidate = match[0];
			if (candidate.length > len) {
				len = candidate.length;
				tag = sig;
			}
		}
	}

	return tag ? { tag, len } : undefined;
}
