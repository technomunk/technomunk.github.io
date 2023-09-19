import { error } from "../../util";
import type { CodeBlock } from "../codeblock";
import { Interpreter } from "./base";

export class BnfkInterpreter extends Interpreter {
    dataIndex = 0

    input = ""
    protected _output = ""

    readonly exprs: string
    readonly data: Array<number> = []

    constructor(code: CodeBlock, dataSize: number) {
        super(code)
        this.exprs = [...code.expressions()]
            .map(e => e.length == 1 ? e : error(`Invalid expr: ${e}`))
            .join("")

        for (let i = 0; i < dataSize; ++i) {
            this.data.push(0)
        }
    }

    get val(): number {
        return this.data[this.dataIndex]
    }

    reset() {
        this.exprIndex = 0
        this.dataIndex = 0
        for (let i = 0; i < this.data.length; ++i) {
            this.data[i] = 0
        }
    }

    step() {
        this.exec(this.exprs[this.exprIndex])
        this.exprIndex++
    }

    exec(expr: string): void {
        switch (expr) {
            case "+":
                this.data[this.dataIndex]++
                break
            case "-":
                this.data[this.dataIndex]--
                break
            case "<":
                this.dataIndex--
                break
            case ">":
                this.dataIndex++
                break
            case ",":
                this.read()
                break
            case ".":
                this.print()
                break
            case "[":
                this.jumpForward()
                break
            case "]":
                this.jumpBackward()
                break
            default:
                console.error("Unknown expr:", expr)
                this.exprIndex++
        }
    }

    read() {
        const charCode = this.input.charCodeAt(0)
        this.data[this.dataIndex] = Number.isNaN(charCode) ? 0 : charCode
        this.input = this.input.substring(1)
    }
    print() {
        this._output += String.fromCharCode(this.val)
    }

    get output(): string {
        return this._output
    }

    jumpForward() {
        if (this.val != 0) {
            return
        }

        let skips = 0
        for (let i = this.exprIndex + 1; i < this.exprs.length; ++i) {
            const expr = this.exprs[i]
            if (expr == "[") {
                skips++
            } else if (expr == "]") {
                if (skips > 0) {
                    skips--
                } else {
                    this.exprIndex = i
                    return
                }
            }
        }
    }
    jumpBackward() {
        if (this.val == 0) {
            return
        }
        let skips = 0
        for (let i = this.exprIndex - 1; i >= 0; --i) {
            const ch = this.exprs[i]
            if (ch == "]") {
                skips++
            } else if (ch == "[") {
                console.debug({skips})
                if (skips > 0) {
                    skips--
                } else {
                    this.exprIndex = i - 1
                    return
                }
            }
        }

    }
}
