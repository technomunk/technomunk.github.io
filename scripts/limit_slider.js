'strict mode';

// Declare constants

const REDRAW_DELAY = 600;
const FADE_DELAY = 600;
const FADE_TOTAL_ITERATIONS = 50;
const FADE_ITERATION_PERIOD = 20;

// Initialize global variables

let slider = document.getElementById('limitSlider');
let label = document.getElementById('limitSliderLabel');

var redrawTimer = 0;
var prefadeTimer = 0;
var fadeTimer = 0;
var fadeIteration = 0;

// Define functions

function fadeoutDisplay() {
	if (fadeIteration++ == FADE_TOTAL_ITERATIONS) {
		clearInterval(fadeTimer);
	}
	label.style.opacity = (FADE_TOTAL_ITERATIONS - fadeIteration) / FADE_TOTAL_ITERATIONS;
}

function beginFade() {
	fadeTimer = window.setInterval(fadeoutDisplay, FADE_ITERATION_PERIOD);
}

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

function redrawAfterDelay() {
	clearTimeout(redrawTimer);
	redrawTimer = window.setTimeout(redraw, REDRAW_DELAY);
}

// Register event listeners

slider.addEventListener('input', updateDisplayedValue);
slider.addEventListener('input', redrawAfterDelay);

document.getElementById('limitSliderMinus').addEventListener('click', function () {
	slider.value = Number(slider.value) - 1;
	updateDisplayedValue();
	redrawAfterDelay();
});

document.getElementById('limitSliderPlus').addEventListener('click', function () {
	slider.value = Number(slider.value) + 1;
	updateDisplayedValue();
	redrawAfterDelay();
});
