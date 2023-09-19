import { AsmInterpreter } from "../lib/code/interpreter/asm"
import { Choice, error } from "../lib/util"
import { CodeBlock } from "../lib/code/codeblock"
import { GRAMMARS } from "../lib/code/grammar"
import { setHighlight } from "../lib/highlight"


class AsmInterpreterElement extends HTMLElement {
    readonly interpreter: AsmInterpreter
    readonly args: Map<string, Choice<number>> = new Map()

    protected vars: Map<string, HTMLInputElement> = new Map()
    protected menu: HTMLDivElement

    constructor() {
        super()
        for (const { name, value } of this.attributes) {
            if (name.startsWith("arg-")) {
                this.args.set(name.slice(4), new Choice(...value.split(",").map(a => parseInt(a))))
            }
        }

        if (this.childElementCount == 1) {
            if (this.children[0] instanceof HTMLPreElement) {
                this.innerHTML = this.children[0].innerHTML
            }
        }
        const code = new CodeBlock(this.querySelector("code") || error("Missing <code> element to interpret"), GRAMMARS.asm)
        this.interpreter = new AsmInterpreter(code)
        this.interpreter.vars.set("cmp")
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
        this.interpreter.code.highlightExpr(this.interpreter.exprIndex)
    }

    reset() {
        this.interpreter.reset()
        for (const [name, choice] of this.args) {
            this.interpreter.vars.set(name, choice.random())
        }
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
            setHighlight(text, true)
        })

        this.menu.appendChild(view)
        return view
    }


    protected setVar(name: string, val: number) {
        const element = this.vars.get(name)!
        if (element.value != val.toFixed()) {
            element.value = val.toFixed()
            setHighlight(element, true)
        } else {
            setHighlight(element, false)
        }
    }
}

customElements.define("asm-interpreter", AsmInterpreterElement)
