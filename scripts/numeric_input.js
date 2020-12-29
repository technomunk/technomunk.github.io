'strict mode';

(function(){

// Constants

const REDRAW_DELAY = 600;

// Global variables

let limit = document.getElementById('limit'),
	redrawTimer = 0,
	drawnLimit = Number(limit.value);

// Free functions

/** Redraw the picture on the 'mainCanvas' after a set delay. Cancels any pending redraws.
 * @param {Number} limit The limit to use when redrawing.
 * @param {Number} delay The number of milliseconds to wait before redrawing.
 */
function redrawAfterDelay(limit, delay) {
	clearTimeout(redrawTimer);
	redrawTimer = window.setTimeout(
		() => {
			if (limit !== drawnLimit) {
				redraw(limit);
				drawnLimit = limit;
			}
		},
		delay);
}

/** Redraw the picture immediately and cancel any pending redraws.
 * @param {Number} limit The limit to use when redrawing.
 */
function redrawImmediately(limit) {
	clearTimeout(redrawTimer);
	if (limit !== drawnLimit) {
		redraw(limit);
		drawnLimit = limit;
	}
}

// Register event listeners

limit.addEventListener('input', () => {
	let value = Number(limit.value);

	if (value < limit.min) {
		value = Number(limit.min);
	} else if (value > limit.max) {
		value = Number(limit.max);
	}

	if (value >= Number(limit.min) && value <= Number(limit.max)) {
		redrawAfterDelay(value, REDRAW_DELAY);
	}
});
limit.addEventListener('change', () => {
	let value = 0;
	
	// Validate input
	if (limit.value === '') {
		limit.value = 30;
	}
	
	value = Number(limit.value);

	if (value < limit.min) {
		limit.value = limit.min;
	} else if (value > limit.max) {
		limit.value = limit.max;
	}

	redrawImmediately(Number(limit.value));
});

}());
