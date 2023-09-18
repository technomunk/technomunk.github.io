import { CodeBlock } from "./code"

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

type AsmOp = (interpreter: AsmInterpreter, args: string[]) => void
type OpStore = { [opcode: string]: AsmOp }

const OPS: OpStore = {
    mov(interpreter: AsmInterpreter, line: string[]) {
        if (line.length != 3) {
            throw "Illegal mov instruction"
        }
        let value = parseInt(line[2])
        if (Number.isNaN(value)) {
            value = interpreter.vars.get(line[2])
        }
        interpreter.vars.set(line[1], value)
    },
    inc(interpreter: AsmInterpreter, line: string[]) {
        if (line.length != 2) {
            throw "Illegal inc instruction"
        }
        interpreter.vars.set(line[1], interpreter.vars.get(line[1]) + 1)
    },
    mul(interpreter: AsmInterpreter, line: string[]) {
        if (line.length != 3) {
            throw "Illegal mul instruction"
        }
        let value = interpreter.vars.get(line[1]) * interpreter.vars.get(line[2])
        interpreter.vars.set(line[1], value)
    },
    cmp(interpreter: AsmInterpreter, line: string[]) {
        if (line.length != 3) {
            throw "Illegal cmp instruction"
        }
        let valA = interpreter.vars.get(line[1])
        let valB = interpreter.vars.get(line[2])
        interpreter.vars.set("cmp", Math.sign(valA - valB))
    },
    jb(interpreter: AsmInterpreter, line: string[]) {
        if (line.length != 2) {
            throw "Illegal jb instruction"
        }
        if (interpreter.vars.get("cmp") == -1) {
            interpreter.jumpTo(line[1])
        }
    },
    ret(interpreter: AsmInterpreter, line: string[]) {
        if (line.length != 1) {
            throw "Illegal ret instruction"
        }
        // TODO: actual call stack
        alert("Computation done!")
        interpreter.nextLineIdx = -1
    },
}

export class AsmInterpreter {
    vars = new VariableStore()
    code: CodeBlock;
    nextLineIdx = 0;

    protected instructions: Map<string, AsmOp> = new Map()

    constructor(code: CodeBlock) {
        this.code = code
        this.reset()
    }

    reset() {
        this.nextLineIdx = 0
        for (const name of this.code.vars) {
            this.vars.set(name, initialVar())
        }
        this.vars.set("cmp", initialVar())
    }

    step() {
        const line = this.code.getLine(this.nextLineIdx)
            .replace(",", " ")
            .split(" ")
            .filter(w => w.length)

        OPS[line[0]](this, line)
        ++this.nextLineIdx
    }

    jumpTo(label: string) {
        this.nextLineIdx = this.code.deref(label) - 1
    }

    addInstruction(instruction: AsmOp) {
        this.instructions.set(instruction.name, instruction)
    }
}

function initialVar(): number {
    return Math.trunc(Math.random() * (1 << 16))
}
