import { Choice } from "@lib/util"

const BIT_CHOICE = new Choice("0", "1")
const BIAS = 150  // -127 of actual bias + 23 insignificant bits

interface Bits {
    sign: string
    exponent: string
    mantissa: string
}

class FloatBitmap extends HTMLDivElement {
    readonly bitElements: Array<HTMLElement>
    readonly decimalElement: HTMLInputElement

    static HIDDEN_BIT_INDEX = 9

    // TODO: show the exponent and mantissa values in decimal representation as well
    constructor() {
        super()

        this.bitElements = this.collectBitCells()
        this.decimalElement = this.querySelector("input")!
        this.updateValue()
    }

    gatherBits(): Bits {
        const bitContents = this.bitElements.map(e => e.textContent)
        return {
            sign: bitContents[0]!,
            exponent: bitContents.slice(1, 9).join(""),
            mantissa: bitContents.slice(9).join(""),
        }
    }

    set hiddenBit(value: "0" | "1" | "x") {
        this.bitElements[FloatBitmap.HIDDEN_BIT_INDEX].textContent = value
    }

    updateValue() {
        const bits = this.gatherBits()
        if (bits.exponent == "00000000") {
            this.hiddenBit = "0"
            bits.mantissa = "0" + bits.mantissa.slice(1)
        } else if (bits.exponent == "11111111") {
            this.hiddenBit = "x"
            bits.mantissa = bits.mantissa.slice(1)
        } else {
            this.hiddenBit = "1"
            bits.mantissa = "1" + bits.mantissa.slice(1)
        }

        let value = convertBits(bits)
        if (typeof value === "number") {
            value = value.toString()
        }
        this.decimalElement.value = value
    }

    protected collectBitCells(): Array<HTMLElement> {
        const result = []
        for (const element of this.querySelectorAll(".bit")) {
            this.setupBitCell(element as HTMLSpanElement)
            result.push(element as HTMLSpanElement)
        }
        return result
    }

    protected setupBitCell(cell: HTMLElement) {
        cell.textContent = BIT_CHOICE.random()
        if (!cell.parentElement!.classList.contains("hidden")) {
            cell.onclick = (ev) => {
                ev.preventDefault()
                cell.textContent = (cell.textContent == "0") ? "1" : "0";
                this.updateValue()
            }
        }
    }
}

function convertBits(bits: Bits): number | string {
    const exponent = parseInt(bits.exponent, 2)
    const mantissa = parseInt(bits.mantissa, 2)

    let value = (bits.sign == "1") ? -mantissa : mantissa

    if (exponent == 255) {
        if (mantissa != 0) {
            return NaN
        } else if (bits.sign == "1") {
            return -Infinity
        } else {
            return Infinity
        }
    }
    if (exponent == 0 && mantissa == 0) {
        return value * Math.pow(2, -BIAS + 1)
    }
    return value * Math.pow(2, exponent - BIAS)
}

customElements.define("float-bitmap", FloatBitmap, { extends: "div" })
