const drawConfigElements: Array<HTMLInputElement> = [];

export function bindConfig(element: HTMLInputElement, setter: (val: number) => void): void {
	const min = Number(element.min),
		max = Number(element.max);
	const defaultValue = Number(element.value);
	drawConfigElements.push(element);
	
	const listener = () => {
		let value = Number(element.value);
		if (element.value === '') {
			value = defaultValue;
			element.value = value.toString();
		}

		if (value < min) {
			value = min;
			element.value = value.toString();
		} else if (value > max) {
			value = max;
			element.value = value.toString();
		}

		if (value >= min && value <= max) {
			setter(value);
		}
	};
	element.addEventListener('input', listener);
	element.addEventListener('change', listener);
}

export function resetConfigs(): void {
	drawConfigElements.forEach(element => {
		element.value = '';
		const event = document.createEvent('Event');
		event.initEvent('input');
		element.dispatchEvent(event);
	});
}
