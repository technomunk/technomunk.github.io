import { CodeBlock } from "./code"
import { Interpreter } from "./interpreter"

export class InterpreterUI {
    protected interpreter: Interpreter
    protected vars: Map<string, HTMLElement> = new Map()
    protected menu: HTMLDivElement

    constructor(element: HTMLElement) {
        const code = new CodeBlock(element)
        this.interpreter = new Interpreter(code)
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
        this.interpreter.vars.set("di", 16)
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
        // const label = document.createElement("label")
        // label.classList.add("var-label")
        // label.htmlFor = name
        // label.textContent = name
        // this.menu.appendChild(label)

        const view = document.createElement("div")
        view.id = name
        view.classList.add("var-view")
        this.vars.set(name, view)
        this.setVar(name, val ?? NaN)
        this.menu.appendChild(view)

        return view
    }

    protected setVar(name: string, val: number) {
        const element = this.vars.get(name)!
        const newVal = `${name}: ${val}`
        if (element.textContent != newVal) {
            element.textContent = newVal
            element.classList.add("highlight")
        } else {
            element.classList.remove("highlight")
        }

    }
}
