import { BnfkInterpreter } from "../lib/code/interpreter/bnfk"
import { Choice, error } from "../lib/util"
import { CodeBlock } from "../lib/code/codeblock"
import { GRAMMARS } from "../lib/code/grammar"
import { setHighlight } from "../lib/highlight"


class BnfkInterpreterElement extends HTMLElement {
    interpreter: BnfkInterpreter
    menu: HTMLDivElement
    varGrid: HTMLDivElement
    runButton: HTMLButtonElement
    input: HTMLInputElement
    output: HTMLInputElement
    vars: HTMLInputElement[] = []

    running = false
    names: Choice<string>

    constructor() {
        super()

        if (this.childElementCount == 1) {
            if (this.children[0] instanceof HTMLPreElement) {
                this.innerHTML = this.children[0].innerHTML
            }
        }

        const { cellCount, names } = this.parseAttrs()
        this.names = new Choice(...names)

        const code = new CodeBlock(this.querySelector("code") || error("Missing <code> element to interpret!"), GRAMMARS.bnfk)
        this.interpreter = new BnfkInterpreter(code, cellCount)

        this.runButton = document.createElement("button")
        this.input = document.createElement("input")
        this.output = document.createElement("input")
        this.varGrid = this.createVarGrid()
        this.menu = this.createMenu()
        this.appendChild(this.menu)

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

    protected createVarGrid(): HTMLDivElement {
        this.varGrid = document.createElement("div")
        this.varGrid.classList.add("shelf")
        return this.varGrid
    }

    protected createMenu(): HTMLDivElement {
        this.menu = document.createElement("div")
        this.menu.classList.add("code-menu")
        this.menu.appendChild(this.varGrid)

        for (let i = 0; i < this.interpreter.data.length; ++i) {
            this.createVarView(this.interpreter.data[i])
        }

        this.input.classList.add("input")
        this.input.placeholder = "input"
        this.input.addEventListener("change", (e) => {
            e.preventDefault()
            this.interpreter.input = this.input.value
        })
        this.menu.appendChild(this.input)

        this.output.classList.add("output")
        this.output.placeholder = "output"
        this.output.disabled = true
        this.menu.appendChild(this.output)

        this.createControls()

        return this.menu
    }

    protected createControls() {
        const controls = document.createElement("div")
        controls.classList.add("controls")

        const stepButton = document.createElement("button")
        stepButton.textContent = "step"
        stepButton.addEventListener("click", (e) => {
            e.preventDefault()
            this.running = false
            this.runButton.textContent = "start"
            this.step()
        })
        controls.appendChild(stepButton)

        this.runButton.textContent = "start"
        this.runButton.addEventListener("click", (e) => {
            e.preventDefault()
            this.toggleRun()
        })
        controls.appendChild(this.runButton)

        const resetButton = document.createElement("button")
        resetButton.textContent = "reset"
        resetButton.addEventListener("click", (e) => {
            e.preventDefault()
            this.reset()
        })
        controls.appendChild(resetButton)

        this.menu.appendChild(controls)
    }

    protected createVarView(val: number) {
        const text = document.createElement("input")
        text.classList.add("ta-center")
        text.inputMode = "numeric"
        const idx = this.vars.length
        this.vars.push(text)
        this.setVar(idx, val)

        this.varGrid.appendChild(text)
        text.addEventListener("input", () => {
            this.interpreter.data[idx], parseInt(text.value)
            setHighlight(text, true)
        })
    }

    protected setVar(idx: number, val: number) {
        this.vars[idx].value = val.toFixed()
    }
}

customElements.define("bnfk-interpreter", BnfkInterpreterElement)
