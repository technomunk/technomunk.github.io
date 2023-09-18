import type { Code, InlineCode, Root } from 'mdast'

import { visit } from 'unist-util-visit'
import { tokenize } from '../../scripts/lib/code'

function highlightNode(node: Code | InlineCode, fallbackLang?: "brainfuck" | "asm") {
    node.value = `<code>${tokenize(node.value, (node as any).lang || fallbackLang)}</code>`
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
        if (fallbackLang == "asm" || fallbackLang == "brainfuck") {
            types.push("inlineCode")
        } else {
            console.warn("Unknown fallback language:", fallbackLang)
        }
        visit(tree, types, (node) => highlightNode(node as Code | InlineCode, fallbackLang))
    }
}
