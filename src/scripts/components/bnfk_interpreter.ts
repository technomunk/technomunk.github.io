import { BnfkInterpreter } from "@lib/code/interpreter/bnfk"
import { Choice, error } from "@lib/util"
import { CodeBlock } from "@lib/code/codeblock"
import { GRAMMARS } from "@lib/code/grammar"
import { setHighlight } from "@lib/highlight"


class BnfkInterpreterElement extends HTMLElement {
    interpreter: BnfkInterpreter
    runButton: HTMLButtonElement
    input: HTMLInputElement
    output: HTMLInputElement
    vars: HTMLInputElement[] = []

    running = false
    names: Choice<string>

    constructor() {
        super()

        if (this.children[0] instanceof HTMLPreElement) {
            const children = this.children[0].children
            this.children[0].remove()
            this.prepend(...children)
        }

        const { cellCount, names } = this.parseAttrs()
        this.names = new Choice(...names)

        const code = new CodeBlock(this.querySelector("code") || error("Missing <code> element to interpret!"), GRAMMARS.bnfk)
        this.interpreter = new BnfkInterpreter(code, cellCount)

        this.runButton = this.querySelector("button#run")!
        this.input = this.querySelector("input#input")!
        this.output = this.querySelector("input#output")!

        this.setupControls()

        this.vars = [...this.querySelectorAll("#vars>input")] as HTMLInputElement[]

        this.reset()
    }

    step(autostep = false) {
        const dataIdx = this.interpreter.dataIndex
        const exprIdx = this.interpreter.exprIndex
        if (exprIdx >= this.interpreter.exprs.length) {
            return
        }
        this.interpreter.step()

        this.vars[this.interpreter.dataIndex].value = this.interpreter.val.toFixed()
        this.output.value = this.interpreter.output

        if (dataIdx != this.interpreter.dataIndex) {
            setHighlight(this.vars[dataIdx], false)
            setHighlight(this.vars[this.interpreter.dataIndex], true)
        }
        if (exprIdx != this.interpreter.exprIndex) {
            if (this.interpreter.exprIndex >= this.interpreter.exprs.length) {
                this.running = false
                this.runButton.textContent = "DONE"
                this.runButton.disabled = true
                return
            }
            this.interpreter.code.highlightExpr(this.interpreter.exprIndex)
        }

        if (autostep && this.running) {
            setTimeout(() => this.step(true), 50)
        }
    }

    reset() {
        setHighlight(this.vars[this.interpreter.dataIndex], false)
        this.interpreter.reset()
        this.interpreter.code.highlightExpr(this.interpreter.exprIndex)
        setHighlight(this.vars[this.interpreter.dataIndex], true)
        for (const varView of this.vars) {
            varView.value = "0"
        }
        this.input.value = this.names.random()
        this.interpreter.input = this.input.value
        this.output.value = this.interpreter.output
        this.running = false
        this.runButton.textContent = "start"
        this.runButton.disabled = false
    }

    toggleRun() {
        this.running = !this.running
        if (this.running) {
            this.step(true)
        }
        this.runButton.textContent = this.running ? "stop" : "start"
    }

    protected parseAttrs(): { cellCount: number, names: string[] } {
        const cells = this.getAttribute("cells") || error("Missing 'cells' attr")
        const cellCount = parseInt(cells)
        if (Number.isNaN(cellCount)) { throw `Invalid cell count: ${cells}` }

        const names = this.getAttribute("names") || error("Missing 'names' attr")
        return {
            cellCount,
            names: names.split(";")
        }
    }


    protected setupControls() {
        const stepButton = this.querySelector("button#step") as HTMLButtonElement
        stepButton.addEventListener("click", (e) => {
            e.preventDefault()
            this.running = false
            this.runButton.textContent = "start"
            this.step()
        })

        this.runButton.textContent = "start"
        this.runButton.addEventListener("click", (e) => {
            e.preventDefault()
            this.toggleRun()
        })

        const resetButton = document.querySelector("button#reset") as HTMLButtonElement
        resetButton.addEventListener("click", (e) => {
            e.preventDefault()
            this.reset()
        })
    }

    protected setVar(idx: number, val: number) {
        this.vars[idx].value = val.toFixed()
    }
}

customElements.define("bnfk-interpreter", BnfkInterpreterElement)
