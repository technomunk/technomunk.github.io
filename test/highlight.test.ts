import { expect, test } from 'vitest';

import { highlightTokens } from '@lib/code/lex/highlight';

test('highlight lisp', () => {
	const src = '(write "Hello world!")';
	const expected =
		'<span class="s-punctuation">(</span><span class="s-keyword">write</span> <span class="s-string">"Hello world!"</span><span class="s-punctuation">)</span>';
	expect(highlightTokens(src, 'lisp')).toStrictEqual(expected);
});
