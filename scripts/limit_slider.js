'strict mode';

(function(){

// Constants

const REDRAW_DELAY = 200;
const FADE_DELAY = 600;
const FADE_TOTAL_ITERATIONS = 50;
const FADE_ITERATION_PERIOD = 20;

// Global variables

let slider = document.getElementById('limitSlider'),
	label = document.getElementById('limitSliderLabel'),
	redrawTimer = 0,
	prefadeTimer = 0,
	fadeTimer = 0,
	fadeIteration = 0;

// Define functions

/** Fade (make transparent) the label text.
 */
function fadeoutDisplay() {
	if (++fadeIteration == FADE_TOTAL_ITERATIONS) {
		clearInterval(fadeTimer);
	}
	label.style.opacity = (FADE_TOTAL_ITERATIONS - fadeIteration) / FADE_TOTAL_ITERATIONS;
}

/** Begin the fading process.
 */
function beginFade() {
	fadeTimer = window.setInterval(fadeoutDisplay, FADE_ITERATION_PERIOD);
}

/** Update displayed label text, its position and queue its fade.
 */
function updateDisplayedValue() {
	label.textContent = slider.value;

	let labelRect = label.getBoundingClientRect();
	let sliderRect = slider.getBoundingClientRect();
	let a = slider.value / slider.max;
	label.style.top = `${sliderRect.y - labelRect.height}px`;
	label.style.left = `${sliderRect.x + sliderRect.width*a - labelRect.width*.5}px`;
	
	clearInterval(fadeTimer);
	clearTimeout(prefadeTimer);
	fadeIteration = 0;
	
	label.style.opacity = 1;
	prefadeTimer = window.setTimeout(beginFade, FADE_DELAY);
}

/** Redraw the picture on the 'mainCanvas' after a set delay. Cancels any pending redraws.
 * @param {Number} delay number of milliseconds to wait before redrawing.
 */
function redrawAfterDelay(delay = REDRAW_DELAY) {
	clearTimeout(redrawTimer);
	redrawTimer = window.setTimeout(redraw, REDRAW_DELAY);
}

/** Redraw the picture immediately and cancel any pending redraws.
 */
function redrawImmediately() {
	clearTimeout(redrawTimer);
	redraw();
}

// Register event listeners

slider.addEventListener('input', updateDisplayedValue);
slider.addEventListener('input', redrawAfterDelay);
slider.addEventListener('change', redrawImmediately);

document.getElementById('limitSliderMinus').addEventListener('click', function () {
	slider.value = Number(slider.value) - 1;
	updateDisplayedValue();
	redrawImmediately();
});

document.getElementById('limitSliderPlus').addEventListener('click', function () {
	slider.value = Number(slider.value) + 1;
	updateDisplayedValue();
	redrawImmediately();
});

}());
