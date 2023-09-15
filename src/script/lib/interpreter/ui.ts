import { Choice } from "../util"
import { CodeBlock, tokenize } from "./code"
import { AsmInterpreter } from "./asm"
import { BrainfuckInterpreter } from "./brainfuck"

export class InterpreterUI {
    arg = new Choice(16, 25, 36, 49, 64)
    protected interpreter: AsmInterpreter
    protected vars: Map<string, HTMLInputElement> = new Map()
    protected menu: HTMLDivElement

    constructor(element: HTMLElement) {
        const code = new CodeBlock(element)
        this.interpreter = new AsmInterpreter(code)
        this.menu = this.createMenu()
        code.element.parentNode!.appendChild(this.menu)
        this.reset()
    }

    step() {
        this.interpreter.step()
        this.update()
    }

    update() {
        for (const [name, value] of this.interpreter.vars) {
            this.setVar(name, value)
        }
        this.interpreter.code.highlightLine(this.interpreter.nextLineIdx)
    }

    reset() {
        this.interpreter.reset()
        this.interpreter.vars.set("di", this.arg.random())
        this.update()
    }

    protected createMenu(): HTMLDivElement {
        this.menu = document.createElement("div")
        this.menu.classList.add("code-menu")

        for (const [name, val] of this.interpreter.vars) {
            this.createVarView(name, val)
        }

        this.createControls()

        return this.menu
    }

    protected createControls() {
        const controlContainer = document.createElement("div")
        controlContainer.classList.add("controls")

        const nextButton = document.createElement("button")
        nextButton.onclick = this.step.bind(this)
        nextButton.textContent = "next"
        controlContainer.appendChild(nextButton)

        const resetButton = document.createElement("button")
        resetButton.onclick = this.reset.bind(this)
        resetButton.textContent = "reset"
        controlContainer.appendChild(resetButton)

        this.menu.appendChild(controlContainer)
    }

    protected createVarView(name: string, val?: number): HTMLDivElement {
        const view = document.createElement("div")
        view.classList.add("shelf")

        const label = document.createElement("label")
        label.classList.add("var-label")
        label.htmlFor = name
        label.textContent = `${name}:`
        view.appendChild(label)

        const text = document.createElement("input")
        text.classList.add("ta-end")
        text.inputMode = "numeric"
        text.id = name
        this.vars.set(name, text)
        this.setVar(name, val ?? NaN)
        view.appendChild(text)
        text.addEventListener("input", () => {
            this.interpreter.vars.set(name, parseInt(text.value))
            this.setHighlight(text, true)
        })

        this.menu.appendChild(view)
        return view
    }

    protected setVar(name: string, val: number) {
        const element = this.vars.get(name)!
        if (element.value != val.toFixed()) {
            element.value = val.toFixed()
            this.setHighlight(element, true)
        } else {
            this.setHighlight(element, false)
        }
    }

    protected setHighlight(element: HTMLInputElement, highlight: boolean) {
        if (highlight) {
            element.parentElement?.classList.add("highlight")
        } else {
            element.parentElement?.classList.remove("highlight")
        }
    }
}

export class BrainfuckUI {
    interpreter: BrainfuckInterpreter
    menu: HTMLDivElement
    varGrid: HTMLDivElement
    runButton: HTMLButtonElement
    input: HTMLInputElement
    output: HTMLInputElement
    code: HTMLSpanElement[] = []
    vars: HTMLInputElement[] = []

    running = false

    constructor(element: HTMLElement) {
        let code = element.textContent!
        element.innerHTML = tokenize(code, "brainfuck")
        for (const child of element.querySelectorAll("span")) {
            if (!child.classList.contains("comment")) {
                this.code.push(child)
            }
        }
        this.runButton = document.createElement("button")
        this.input = document.createElement("input")
        this.output = document.createElement("input")
        this.interpreter = new BrainfuckInterpreter(filterOps(code))
        this.varGrid = this.createVarGrid()
        this.menu = this.createMenu()
        this.reset()
        element.parentElement!.appendChild(this.menu)
    }

    step(autostep = false) {
        const dataIdx = this.interpreter.dataIdx
        const codeIdx = this.interpreter.codeIdx
        if (codeIdx >= this.code.length) {
            return
        }
        this.interpreter.step()

        this.vars[this.interpreter.dataIdx].value = this.interpreter.val.toFixed()
        this.output.value = this.interpreter.output

        if (dataIdx != this.interpreter.dataIdx) {
            this.setHighlight(this.vars[dataIdx], false)
            this.setHighlight(this.vars[this.interpreter.dataIdx], true)
        }
        if (codeIdx != this.interpreter.codeIdx) {
            this.setHighlight(this.code[codeIdx], false)
            if (this.interpreter.codeIdx >= this.code.length) {
                this.running = false
                this.runButton.textContent = "DONE"
                this.runButton.disabled = true
                return
            }
            this.setHighlight(this.code[this.interpreter.codeIdx], true)
        }

        if (autostep && this.running) {
            setTimeout(() => this.step(true), 50)
        }
    }

    reset() {
        if (this.interpreter.codeIdx < this.code.length) {
            this.setHighlight(this.code[this.interpreter.codeIdx], false)
        }
        this.setHighlight(this.vars[this.interpreter.dataIdx], false)
        this.interpreter.reset()
        this.setHighlight(this.code[this.interpreter.codeIdx], true)
        this.setHighlight(this.vars[this.interpreter.dataIdx], true)
        for (const varView of this.vars) {
            varView.value = "0"
        }
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
            this.setHighlight(text, true)
        })
    }

    protected setVar(idx: number, val: number) {
        this.vars[idx].value = val.toFixed()
    }

    protected setHighlight(element: HTMLElement, highlight: boolean) {
        if (highlight) {
            element.classList.add("highlight")
        } else {
            element.classList.remove("highlight")
        }
    }
}


function filterOps(text: string): string {
    const result = []
    for (const ch of text) {
        if ("+-<>.,[]".includes(ch)) {
            result.push(ch)
        }
    }
    return result.join("")
}
