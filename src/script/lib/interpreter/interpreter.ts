import { error } from "../util"
import { CodeBlock } from "./code"

type Operation = (interpreter: Interpreter, line: string[]) => void

export class Variable {
    public value?: number

    constructor(value?: number) {
        this.value = value
    }
}

export class VariableStore implements Iterable<[string, number]> {
    protected _vars: Map<string, number> = new Map()

    get(name: string): number {
        let value = this._vars.get(name)
        if (value == undefined) {
            value = this._default()
            this._vars.set(name, value)
        }
        return value
    }

    set(name: string, value: number) {
        this._vars.set(name, value)
    }

    [Symbol.iterator](): Iterator<[string, number], any, undefined> {
        return this._vars.entries()
    }

    clear() {
        this._vars.clear()
    }

    protected _default(): number {
        return Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER)
    }
}

export class Interpreter {
    vars = new VariableStore()
    code: CodeBlock
    nextLineIdx = 0

    protected instructions: Map<string, Operation> = new Map([
        ["mov", mov],
        ["inc", inc],
        ["mul", mul],
        ["cmp", cmp],
        ["jb", jb],
        ["ret", ret],
    ])

    constructor(code: CodeBlock) {
        this.code = code
    }

    reset() {
        this.nextLineIdx = 0
    }

    next() {
        const line = this.code.getLine(this.nextLineIdx)
            .replace(",", " ")
            .split(" ")
            .filter(w => w.length)

        let op = this.instructions.get(line[0]) ?? error(`Unknown opcode: ${line[0]}`)
        op(this, line)
        ++this.nextLineIdx
    }

    jumpTo(label: string) {
        this.nextLineIdx = this.code.deref(label) - 1
    }
}

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
            if (!this.vars.has(name)) {
                this._createVarView(name)
            }
            const element = this.vars.get(name)!
            const newVal = `${name}: ${value}`
            if (element.textContent != newVal) {
                element.textContent = newVal
                element.classList.add("highlight")
            } else {
                element.classList.remove("highlight")
            }
        }
        this.interpreter.code.highlightLine(this.interpreter.nextLineIdx)
    }

    reset() {
        this.interpreter.reset()
        this.interpreter.vars.set("edi", 16)
        this.interpreter.vars.set("eax", Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER))
        this.interpreter.vars.set("ecx", Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER))
        this.interpreter.vars.set("cmp", Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER))
        this.update()
    }

    protected createMenu(): HTMLDivElement {
        const menu = document.createElement("div")
        menu.classList.add("code-menu")

        const nextButton = document.createElement("button")
        nextButton.onclick = this.next.bind(this)
        nextButton.textContent = "next"
        menu.appendChild(nextButton)

        const resetButton = document.createElement("button")
        resetButton.onclick = this.reset.bind(this)
        resetButton.textContent = "reset"
        menu.appendChild(resetButton)

        return menu
    }

    protected _createVarView(name: string): HTMLDivElement {
        // const label = document.createElement("label")
        // label.classList.add("var-label")
        // label.htmlFor = name
        // label.textContent = name
        // this.menu.appendChild(label)

        const view = document.createElement("div")
        view.id = name
        view.classList.add("var-view")
        this.vars.set(name, view)
        this.menu.appendChild(view)

        return view
    }
}

function mov(interpreter: Interpreter, line: string[]) {
    if (line.length != 3) {
        throw "Illegal mov instruction"
    }
    let value = parseInt(line[2])
    if (Number.isNaN(value)) {
        value = interpreter.vars.get(line[2])
    }
    interpreter.vars.set(line[1], value)
}

function inc(interpreter: Interpreter, line: string[]) {
    if (line.length != 2) {
        throw "Illegal inc instruction"
    }
    interpreter.vars.set(line[1], interpreter.vars.get(line[1]) + 1)
}

function mul(interpreter: Interpreter, line: string[]) {
    if (line.length != 3) {
        throw "Illegal mul instruction"
    }
    let value = interpreter.vars.get(line[1]) * interpreter.vars.get(line[2])
    interpreter.vars.set(line[1], value)
}

function cmp(interpreter: Interpreter, line: string[]) {
    if (line.length != 3) {
        throw "Illegal cmp instruction"
    }
    let valA = interpreter.vars.get(line[1])
    let valB = interpreter.vars.get(line[2])
    interpreter.vars.set("cmp", Math.sign(valA - valB))
}

function jb(interpreter: Interpreter, line: string[]) {
    if (line.length != 2) {
        throw "Illegal jb instruction"
    }
    if (interpreter.vars.get("cmp") == -1) {
        interpreter.jumpTo(line[1])
    }
}

function ret(interpreter: Interpreter, line: string[]) {
    if (line.length != 1) {
        throw "Illegal ret instruction"
    }
    // TODO: actual call stack
    alert("Computation done!")
    interpreter.nextLineIdx = -1
}
