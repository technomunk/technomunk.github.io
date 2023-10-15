import { Choice } from "@lib/util"

const BIT_CHOICE = new Choice("0", "1")

class FloatBitmap extends HTMLDivElement {
    readonly bitElements: Array<HTMLElement>
    readonly decimalElement: HTMLElement

    constructor() {
        super()

        this.bitElements = this.createBitCells()
        {
            const span = document.createElement("span")
            span.textContent = " = "
            this.appendChild(span)
        }
        this.decimalElement = this.createDecimalCell()
        this.updateValue()
    }

    get bits(): string {
        return this.bitElements.map(e => e.textContent).join("")
    }

    updateValue() {
        let value = convertBits(this.bits)
        if (typeof value === "number") {
            value = value.toString()
        }
        this.decimalElement.value = value
    }

    protected createBitCells(): Array<HTMLElement> {
        const result = []
        for (let i = 0; i < 32; ++i) {
            let styleClass: string
            if (i == 0) {
                styleClass = "sign"
            } else if (i <= 8) {
                styleClass = "exponent"
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
        cell.addEventListener(
            "click",
            (_) => {
                cell.textContent = (cell.textContent == "0") ? "1" : "0";
                this.updateValue()
            },
        )

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

function convertBits(bits: string): number | string {
    const sign = bits[0]
    const exponent = parseInt(bits.slice(1, 9), 2)
    const mantissa = parseInt(bits.slice(9), 2)

    let value = (sign == "0") ? -mantissa : mantissa

    switch (exponent) {
        case 0:
            // possibly subnormal value
            if (mantissa == 0) {
                if (sign == "0") {
                    return "-0"
                } else {
                    return 0
                }
            }
            return value * Math.pow(2, -127)
        case 255:
            if (mantissa != 0) {
                return NaN
            } else if (sign == "0") {
                return -Infinity
            } else {
                return Infinity
            }
        default:
            const extraBit = (sign == "0") ? -(1 << 24) : (1 << 24)
            return (value + extraBit) * Math.pow(2, exponent - 127)
    }

}

customElements.define("float-bitmap", FloatBitmap, { extends: "div" })
