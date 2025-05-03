type ValueObserver<T> = (value: T) => void;

/** A generic reference to a value */
export class Ref<T> {
	protected _value: T;
	protected _observers: Array<ValueObserver<T>> = [];

	constructor(value: T) {
		this._value = value;
	}

	get value(): T {
		return this._value;
	}
	set value(val: T) {
		this._value = val;
		this._informObservers();
	}

	addObserver(...observers: Array<ValueObserver<T>>) {
		this._observers.push(...observers);
	}
	removeObservers(...observers: Array<ValueObserver<T>>) {
		for (const observer of observers) {
			this._observers = this._observers.filter((o) => o === observer);
		}
	}

	bindToInput(input: string | HTMLInputElement, serializer: Serializer<T>) {
		if (typeof input === 'string') {
			input = document.querySelector(input) as HTMLInputElement;
		}
		if (input instanceof HTMLInputElement) {
			this._bindToInput(input, serializer);
		} else {
			console.warn('Could not bind reference');
		}
	}

	protected _bindToInput(input: HTMLInputElement, serializer: Serializer<T>) {
		const defaultValue = this.value;
		const listener = () => {
			if (input.value === '') {
				this.value = defaultValue;
				input.value = serializer.serialize(defaultValue);
			} else {
				this.value = serializer.parse(input.value);
			}
		};
		input.addEventListener('change', listener);
		input.addEventListener('input', listener);
		listener();
		this.addObserver((value) => {
			input.value = serializer.serialize(value);
		});
	}

	protected _informObservers() {
		for (const observer of this._observers) {
			observer(this.value);
		}
	}
}

interface Serializer<T> {
	serialize(value: T): string;
	parse(value: string): T;
}

export const SERIALIZER_INTEGER: Serializer<number> = {
	serialize: (value: number) => value.toString(),
	parse: Number.parseInt,
};
export const SERIALIZER_FLOAT: Serializer<number> = {
	serialize: (value: number) => value.toString(),
	parse: Number.parseFloat,
};
