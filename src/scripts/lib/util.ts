let nextId = 0

/** Generate a short(ish) unique identifier for an element for later reference. */
export function uniqueId(): string {
    return `uid-${nextId++}`
}

export function error(message: string): never {
    alert(message)
    throw new Error(message)
}

export function lines(text: string): string[] {
    const result = text.split(/\r?\n/)
    let emptyIdx
    for (let i = 0; i < result.length; ++i) {
        if (result[i].length == 0) {
            emptyIdx = i
        }
    }
    if (emptyIdx != undefined) {
        result.splice(emptyIdx)
    }
    return result
}

export class Choice<T> extends Array<T> {
    constructor(...items: T[]) {
        super(...items)
    }
    random(): T {
        return this[Math.floor(Math.random() * this.length)]
    }
}

export function any(...collections: Array<Iterable<boolean>>): boolean {
    for (const collection of collections) {
        for (const element of collection) {
            if (element) {
                return true
            }
        }
    }
    return false
}

export function repeat(amount: number): Array<null> {
    const result = new Array(amount)
    for (let i = 0; i < amount; ++i) {
        result[i] = null
    }
    return result
}

export function dateCompare(a?: Date | string, b?: Date | string): number {
    a = (a == undefined) ? new Date() : new Date(a)
    b = (b == undefined) ? new Date() : new Date(b)
    return a.getTime() - b.getTime()
}

export function setCanvasSize(canvas: HTMLCanvasElement, width: number, height: number) {
    if (canvas.style.width.endsWith("px")) {
        canvas.style.width = `${width}px`
    }
    if (canvas.style.width.endsWith("px")) {
        canvas.style.height = `${height}px`
    }
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
}

export function clamp(value: number, min = 0, max = 1): number {
    return Math.max(Math.min(value, max), min)
}

export function identity<T>(value: T): T {
    return value
}

export function bindFnToButton(button: HTMLButtonElement | string, fn: () => any) {
    if (typeof button === "string") {
        button = document.querySelector(button) as HTMLButtonElement
    }
    if (button instanceof HTMLInputElement) {
        _bindFnToButton(button, fn)
    } else {
        console.warn("Could not bind reference")
    }
}

function _bindFnToButton(button: HTMLButtonElement, fn: () => any) {
    button.addEventListener("click", () => fn())
}
