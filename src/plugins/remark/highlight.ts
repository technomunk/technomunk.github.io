import type { Code, InlineCode, Root } from 'mdast';
import type { VFile } from 'vfile';

import type { Lang } from '../../scripts/lib/code/types';

import { visit } from 'unist-util-visit';
import { highlightTokens } from '../../scripts/lib/code/lex/highlight';

function highlightNode(node: Code | InlineCode, fallbackLang?: string) {
	const lang = ((node as Code).lang || fallbackLang) as Lang;

	try {
		node.value = `<code>${highlightTokens(node.value, lang)}</code>`;
		if (node.type === 'code') {
			node.value = `<pre>${node.value}</pre>`;
		}
		// @ts-expect-error
		node.type = 'html';
	} catch (error) {
		console.warn(`Couldn't highlight language "${lang}", skipping`);
		console.debug(error);
		return;
	}
}

/** Custom code highlight plugin */
export default function remarkHighlight() {
	return (tree: Root, file: VFile) => {
		if (file.data.astro?.frontmatter?.highlight !== false) {
			visit(tree, ['code', 'inlineCode'], (node) =>
				highlightNode(node as Code | InlineCode, file.data.astro?.frontmatter?.fallbackLang),
			);
		}
	};
}
