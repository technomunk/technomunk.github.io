import { view } from "./canvas";

// Variables
var configs: Array<HTMLInputElement> = [];

// Free functions

function bindConfig(element: HTMLInputElement, setter: (val: number) => void) {
	let min = Number(element.min),
		max = Number(element.max);
	let defaultValue = Number(element.value);
	configs.push(element);
	
	let listener = () => {
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

function resetConfigs() {
	configs.forEach(element => {
		element.value = '';
		let event = document.createEvent('Event');
		event.initEvent('input');
		element.dispatchEvent(event);
	});
}

// Register event listeners

bindConfig(
	document.getElementById('limit') as HTMLInputElement,
	value => {
		let updateRequired = view.limit != value;
		view.limit = value;
		if (updateRequired) {
			view.queueUpdate();
		}
	});
bindConfig(
	document.getElementById('escaper') as HTMLInputElement,
	value => {
		let updateRequired = view.escapeRadius != value;
		view.escapeRadius = value;
		if (updateRequired) {
			view.queueUpdate();
		}
	});


export { resetConfigs }
