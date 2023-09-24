import { AsmInterpreter } from "@lib/code/interpreter/asm"
import { Choice, error } from "@lib/util"
import { CodeBlock } from "@lib/code/codeblock"
import { GRAMMARS } from "@lib/code/grammar"
import { setHighlight } from "@lib/highlight"


class AsmInterpreterElement extends HTMLElement {
    readonly interpreter: AsmInterpreter
    readonly args: Map<string, Choice<number>> = new Map()

    protected vars: Map<string, HTMLInputElement> = new Map()
    protected menu: HTMLDivElement

    constructor() {
        super()

        // TODO: figure out a nice way to set arguments
        this.args.set("di", new Choice(...this.getAttribute("di")!.split(",").map(a => parseInt(a))))

        if (this.children[0] instanceof HTMLPreElement) {
            const children = this.children[0].children
            this.children[0].remove()
            this.prepend(...children)
        }
        const code = new CodeBlock(this.querySelector("code") || error("Missing <code> element to interpret"), GRAMMARS.asm)
        this.interpreter = new AsmInterpreter(code)
        this.interpreter.vars.set("cmp")
        this.menu = this.setupMenu()
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

    protected setupMenu(): HTMLDivElement {
        const menu = this.querySelector("div.interpreter-menu") as HTMLDivElement

        const stepButton = menu.querySelector("button#step") as HTMLButtonElement
        stepButton.onclick = this.step.bind(this)
        const resetButton = menu.querySelector("button#reset") as HTMLButtonElement
        resetButton.onclick = this.reset.bind(this)

        for (const varElement of this.querySelectorAll("[data-is-var]")) {
            if (varElement.textContent) {
                this.interpreter.vars.set(varElement.textContent)
            }
        }

        for (const [varName, value] of this.interpreter.vars) {
            menu.insertBefore(this.createVarView(varName, value), stepButton.parentNode)
        }

        return menu
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
