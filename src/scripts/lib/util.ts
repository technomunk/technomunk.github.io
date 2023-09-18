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
