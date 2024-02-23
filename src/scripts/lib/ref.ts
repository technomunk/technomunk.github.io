import { identity } from "@lib/util"

type ValueObserver<T> = (value: T) => void

/** A generic reference to a value */
export class Ref<T> {
    protected _value: T
    protected _observers: Array<ValueObserver<T>> = []

    constructor(value: T) {
        this._value = value
    }

    get value(): T {
        return this._value
    }
    set value(val: T) {
        this._value = val
        this._informObservers()
    }

    addObserver(...observers: Array<ValueObserver<T>>) {
        this._observers.push(...observers)
    }
    removeObservers(...observers: Array<ValueObserver<T>>) {
        for (const observer of observers) {
            this._observers = this._observers.filter((o) => o === observer)
        }
    }

    protected _informObservers() {
        for (const observer of this._observers) {
            observer(this.value)
        }
    }
}

interface Serializer<T> {
    serialize(value: T): string
    parse(value: string): T
}

export function bind<T>(element: HTMLInputElement, ref: Ref<T>, serializer: Serializer<T>) {
    const defaultValue = ref.value
    const listener = () => {
        if (element.value === "") {
            ref.value = defaultValue
        } else {
            ref.value = serializer.parse(element.value)
        }

    }
    element.addEventListener("change", listener)
    element.addEventListener("input", listener)
    listener()
    ref.addObserver((value) => element.value = serializer.serialize(value))
}

export function tryBindByQuery<T>(query: string, ref: Ref<T>, serializer: Serializer<T>) {
    const element = document.querySelector(query)
    if (element instanceof HTMLInputElement) {
        bind(element, ref, serializer)
    }
}

export const SERIALIZER_INTEGER: Serializer<number> = {
    serialize: (value: number) => value.toString(),
    parse: parseInt,
}
export const SERIALIZER_FLOAT: Serializer<number> = {
    serialize: (value: number) => value.toString(),
    parse: parseFloat
}
