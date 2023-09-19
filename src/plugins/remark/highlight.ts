import type { Code, InlineCode, Root } from 'mdast'

import { visit } from 'unist-util-visit'
import { GRAMMARS } from '../../scripts/lib/code/grammar'
import { markSemanticsWithSpans } from '../../scripts/lib/code/semanitcize'

function highlightNode(node: Code | InlineCode, fallbackLang?: "bnfk" | "asm") {
    node.value = `<code>${markSemanticsWithSpans(node.value, (node as any).lang || fallbackLang)}</code>`
    if (node.type == "code") {
        node.value = `<pre>${node.value}</pre>`
    }
    // @ts-expect-error
    node.type = "html"
}

/** Custom code highlight plugin */
export default function remarkHighlight(options = {}) {
    return (tree: Root, file: any) => {
        const fallbackLang = file.data.astro.frontmatter.fallbackLang
        const types = ["code"]
        if (GRAMMARS[fallbackLang]) {
            types.push("inlineCode")
        } else {
            console.warn("Unknown fallback language:", fallbackLang)
        }
        visit(tree, types, (node) => highlightNode(node as Code | InlineCode, fallbackLang))
    }
}
