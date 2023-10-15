import type { Code, InlineCode, Root } from 'mdast'

import { visit } from 'unist-util-visit'
import { highlightTokens } from '../../scripts/lib/code/lex/highlight'

function highlightNode(node: Code | InlineCode, fallbackLang?: string) {
    const lang = (node as any).lang || fallbackLang

    try {
        node.value = `<code>${highlightTokens(node.value, lang)}</code>`
        if (node.type == "code") {
            node.value = `<pre>${node.value}</pre>`
        }
        // @ts-expect-error
        node.type = "html"
    } catch (error) {
        console.warn(`Couldn't highlight language "${lang}", skipping`)
        console.debug(error)
        return
    }
}

/** Custom code highlight plugin */
export default function remarkHighlight(options = {}) {
    return (tree: Root, file: any) => {
        if (file.data.astro.frontmatter.highlight !== false) {
            visit(
                tree,
                ["code", "inlineCode"],
                (node) => highlightNode(node as Code | InlineCode, file.data.astro.frontmatter.fallbackLang))
        }
    }
}
