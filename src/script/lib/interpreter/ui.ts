import { Choice } from "../util"
import { CodeBlock } from "./code"
import { AsmInterpreter } from "./interpreter"

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

    next() {
        this.interpreter.next()
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
        nextButton.onclick = this.next.bind(this)
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
        view.classList.add("var-view")

        const label = document.createElement("label")
        label.classList.add("var-label")
        label.htmlFor = name
        label.textContent = `${name}:`
        view.appendChild(label)

        const text = document.createElement("input")
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
