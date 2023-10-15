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

        this.bitElements = this.createBitCells()
        {
            const span = document.createElement("span")
            span.textContent = "~="
            this.appendChild(span)
        }
        this.decimalElement = this.createDecimalCell()
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
            this.hiddenBit = "1"
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

    protected createBitCells(): Array<HTMLElement> {
        const result = []
        for (let i = 0; i < 33; ++i) {
            let styleClass: string
            if (i == 0) {
                styleClass = "sign"
            } else if (i <= 8) {
                styleClass = "exponent"
            } else if (i == 9) {
                styleClass = "hidden"
            } else {
                styleClass = "mantissa"
            }
            result.push(this.createBitCell(styleClass))
        }
        return result
    }

    protected createBitCell(styleClass: string): HTMLElement {
        const cell = document.createElement("span")

        cell.classList.add(styleClass, "bit")
        cell.textContent = BIT_CHOICE.random()
        cell.title = styleClass
        if (styleClass != "hidden") {
            cell.addEventListener(
                "click",
                (_) => {
                    cell.textContent = (cell.textContent == "0") ? "1" : "0";
                    this.updateValue()
                },
            )
        }

        this.appendChild(cell)
        return cell
    }

    protected createDecimalCell(): HTMLInputElement {
        const cell = document.createElement("input")

        cell.classList.add("decimal")
        cell.inputMode = "numeric"

        this.appendChild(cell)
        return cell
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
