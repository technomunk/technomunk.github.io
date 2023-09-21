import { setHighlight } from "../highlight"
import { error } from "../util"
import type { Grammar } from "./grammar"

type ExprHTML = HTMLElement
type _Code = [Array<ExprHTML>, Map<string, number>, Set<string>]

export class CodeBlock {
    readonly element: HTMLElement

    protected exprs: Array<ExprHTML>
    protected labels: Map<string, number>
    protected varNames: Set<string>

    protected highlightedExpr: number = 0

    constructor(element: HTMLElement, grammar: Grammar) {
        this.element = element

        const [exprs, labels, varNames] = collectCode(this.element, grammar)
        this.exprs = exprs
        this.labels = labels
        this.varNames = varNames
    }

    get vars(): Iterable<string> {
        return this.varNames
    }
    get exprCount(): number {
        return this.exprs.length
    }

    getExpr(n: number): string {
        return this.exprs[n].innerText
    }
    *expressions(): Generator<string> {
        for (const expr of this.exprs) {
            yield expr.innerText
        }
    }

    deref(label: string): number {
        return this.labels.get(label) ?? error(`Unknown label: "${label}"`)
    }

    highlightExpr(n: number) {
        setHighlight(this.exprs[this.highlightedExpr], false)
        this.highlightedExpr = n
        setHighlight(this.exprs[this.highlightedExpr], true)
    }
}


function collectCode(element: HTMLElement, grammar: Grammar): _Code {
    const exprs: Array<ExprHTML> = []
    const labels: Map<string, number> = new Map()
    const varNames: Set<string> = new Set()
    for (const child of element.querySelectorAll("span")) {
        if (child.hasAttribute("data-is-lbl")) {
            labels.set(grammar.extractLabelName(child.textContent || error("Empty label")), exprs.length)
        }
        if (child.hasAttribute("data-is-var")) {
            varNames.add(child.textContent || error("Missing variable name"))
        }
        if (child.hasAttribute("data-is-expr")) {
            exprs.push(child)
        }
    }
    return [exprs, labels, varNames]
}
