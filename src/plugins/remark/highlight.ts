import type { Code, InlineCode, Root } from 'mdast'

import { visit } from 'unist-util-visit'
import { GRAMMARS } from '../../scripts/lib/code/grammar'
import { markSemanticsWithSpans } from '../../scripts/lib/code/semanitcize'

function highlightNode(node: Code | InlineCode, fallbackLang?: string) {
    const lang = (node as any).lang || fallbackLang
    if (GRAMMARS[lang] == undefined) {
        console.warn(`Unknown language: "${lang}", skipping highlight`)
        return
    }
    node.value = `<code>${markSemanticsWithSpans(node.value, lang)}</code>`
    if (node.type == "code") {
        node.value = `<pre>${node.value}</pre>`
    }
    // @ts-expect-error
    node.type = "html"
}

/** Custom code highlight plugin */
export default function remarkHighlight(options = {}) {
    return (tree: Root, file: any) => {
        visit(
            tree,
            ["code", "inlineCode"],
            (node) => highlightNode(node as Code | InlineCode, file.data.astro.frontmatter.fallbackLang))
    }
}
