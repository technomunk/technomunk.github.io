import type { CodeBlock } from "../codeblock"

export type CodeExecutor = (interpreter: Interpreter, expr: string) => void

export class VarStore implements Iterable<[string, number]> {
    protected vars: Map<string, number> = new Map()

    get(name: string): number {
        let value = this.vars.get(name)
        if (value == undefined) {
            value = this.default()
            this.vars.set(name, value)
        }
        return value
    }

    set(name: string, value?: number) {
        if (value == undefined) {
            value = this.default()
        }
        this.vars.set(name, value)
    }

    [Symbol.iterator](): Iterator<[string, number], any, undefined> {
        return this.vars.entries()
    }

    clear() {
        this.vars.clear()
    }

    protected default(): number {
        return NaN
    }
}

export abstract class Interpreter {
    readonly code: CodeBlock
    exprIndex = 0

    constructor(code: CodeBlock) {
        this.code = code
    }

    step() {
        const expr = this.code.getExpr(this.exprIndex)
        this.exec(expr)
        this.exprIndex++
    }
    reset() {
        this.exprIndex = 0
    }

    abstract exec(expr: string): void
}
