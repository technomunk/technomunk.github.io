import type { Root, Text } from 'mdast';

import { visit } from 'unist-util-visit';

function removeRunts(node: Text) {
	const words = node.value.split(' ').length;
	if (words > 4) {
		node.value = node.value.replace(/ (?=[^ ]*$)/g, '\u00A0');
	}
}

/** Custom code highlight plugin */
export default function remarkRemoveRunts() {
	return (tree: Root) => {
		visit(tree, 'text', removeRunts);
	};
}
