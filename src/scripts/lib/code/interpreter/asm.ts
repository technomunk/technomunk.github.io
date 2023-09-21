import type { CodeBlock } from "../codeblock"
import { Interpreter, VarStore } from "./base"

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
        interpreter.exprIndex = -1
    },
}

export class AsmInterpreter extends Interpreter {
    vars: VarStore = new VarStore()

    constructor(code: CodeBlock) {
        super(code)
        this.vars.set("cmp")
    }

    reset() {
        this.exprIndex = 0
        for (const name of this.code.vars) {
            this.vars.set(name)
        }
    }

    jumpTo(label: string) {
        this.exprIndex = this.code.deref(label) - 1
    }

    exec(expr: string) {
        const line = expr.trim()
            .replace(",", " ")
            .split(" ")
            .filter(w => w.length)
        OPS[line[0]](this, line)
    }
}
