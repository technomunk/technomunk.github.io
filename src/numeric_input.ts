import { view } from "./canvas";

// Constants

const REDRAW_DELAY = 600;

// Global variables

let limit = document.getElementById('limit') as HTMLInputElement,
	redrawTimer = 0,
	drawnLimit = Number(limit.value);

// Free functions

/** Redraw the picture on the 'mainCanvas' after a set delay. Cancels any pending redraws.
 * @param {number} limit The limit to use when redrawing.
 * @param {number} delay The number of milliseconds to wait before redrawing.
 */
function redrawAfterDelay(limit: number, delay: number): void {
	clearTimeout(redrawTimer);
	redrawTimer = window.setTimeout(
		() => {
			if (limit !== drawnLimit) {
				view.update(limit);
				drawnLimit = limit;
			}
		},
		delay);
}

/** Redraw the picture immediately and cancel any pending redraws.
 * @param {number} limit The limit to use when redrawing.
 */
function redrawImmediately(limit: number): void {
	clearTimeout(redrawTimer);
	if (limit !== drawnLimit) {
		view.update(limit);
		drawnLimit = limit;
	}
}

// Register event listeners

limit.addEventListener('input', () => {
	let value = Number(limit.value),
		min = Number(limit.min),
		max = Number(limit.max);

	if (value < min) {
		value = min;
	} else if (value > max) {
		value = max;
	}

	if (value >= min && value <= max) {
		redrawAfterDelay(value, REDRAW_DELAY);
	}
});
limit.addEventListener('change', () => {
	let value = 0,
	min = Number(limit.min),
	max = Number(limit.max);
	
	// Validate input
	if (limit.value === '') {
		limit.value = '30';
	}
	
	value = Number(limit.value);

	if (value < min) {
		limit.value = limit.min;
	} else if (value > max) {
		limit.value = limit.max;
	}

	redrawImmediately(Number(limit.value));
});
