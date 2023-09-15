export type BrainfuckCode = string;

export class BrainfuckInterpreter {
    data: number[] = new Array(8)
    dataIdx = 0
    codeIdx = 0

    input = ""
    protected _output = ""
    protected _code: BrainfuckCode

    constructor(code: BrainfuckCode) {
        this._code = code
        this.reset()
    }

    step() {
        const char = this._code[this.codeIdx]
        switch (char) {
            case "+":
                this.inc()
                break
            case "-":
                this.dec()
                break
            case "<":
                this.back()
                break
            case ">":
                this.forward()
                break
            case ",":
                this.read()
                break
            case ".":
                this.print()
                break
            case "[":
                this.jumpForward()
                break
            case "]":
                this.jumpBackward()
                break
            default:
                console.error("Unknown char:", char)
        }
        this.codeIdx++
    }

    reset() {
        this.codeIdx = 0
        for (let i = 0; i < this.data.length; ++i) {
            this.data[i] = 0
        }
        this.dataIdx = 0
        this._output = ""
    }

    get output(): string {
        return this._output
    }

    get code(): BrainfuckCode {
        return this._code
    }
    set code(value: BrainfuckCode) {
        for (let i = 0; i < this.data.length; ++i) {
            this.data[i] = 0
        }
        this.dataIdx = 0
        this._code = value
    }

    get val(): number {
        return this.data[this.dataIdx]
    }
    set val(value: number) {
        this.data[this.dataIdx] = value
    }

    inc() {
        this.data[this.dataIdx]++
    }
    dec() {
        this.data[this.dataIdx]--
    }

    forward() {
        this.dataIdx++
    }
    back() {
        this.dataIdx--
    }

    read() {
        this.val = this.input.charCodeAt(0)
        this.input = this.input.substring(1)
    }
    print() {
        this._output += String.fromCharCode(this.val)
    }

    jumpForward() {
        if (this.val != 0) {
            return
        }
        let skips = 0
        for (let i = this.codeIdx + 1; i < this._code.length; ++i) {
            const ch = this._code[i]
            if (ch == "[") {
                skips++
            } else if (ch == "]") {
                if (skips > 0) {
                    skips--
                } else {
                    this.codeIdx = i
                    return
                }
            }
        }
    }
    jumpBackward() {
        if (this.val == 0) {
            return
        }
        let skips = 0
        for (let i = this.codeIdx - 1; i >= 0; --i) {
            const ch = this._code[i]
            if (ch == "]") {
                skips++
            } else if (ch == "[") {
                if (skips > 0) {
                    skips--
                } else {
                    this.codeIdx = i - 1
                    return
                }
            }
        }

    }
}
