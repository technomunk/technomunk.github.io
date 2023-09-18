import { AsmInterpreter } from "./lib/asm"
import { CodeBlock, tokenize } from "./lib/code"
import { Choice } from "./lib/util"


class InterpreterElement extends HTMLElement {
    lang: "asm" | "brainfuck"
    interpreter: AsmInterpreter
    arg: Choice<number>
    protected vars: Map<string, HTMLInputElement> = new Map()
    protected menu: HTMLDivElement

    constructor() {
        super()

        const lang = this.getAttribute("lang")
        if (lang == undefined) { throw "Missing 'lang' attribute" }
        if (lang !== "asm" && lang !== "brainfuck") { throw "'lang' must be one of ['asm', 'brainfuck']" }
        this.lang = lang

        const arg = this.getAttribute("arg")
        if (arg == undefined) { throw "Missing 'arg' attribute" }
        this.arg = new Choice(...arg.split(",").map(a => parseInt(a)))

        const code = tokenize(this.textContent!, this.lang)
        this.innerHTML = `<code>${code}</code>`
        this.interpreter = new AsmInterpreter(new CodeBlock(this.querySelector("code")!))
        this.menu = this.createMenu()
        this.appendChild(this.menu)
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

customElements.define("code-interpreter", InterpreterElement)
