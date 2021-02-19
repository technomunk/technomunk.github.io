'use strict';

/** The procedural image view. */
let view = (function(){

// Constants

const WHEEL_SENSITIVITY = 1e-3;
const WHEEL_REDRAW_DELAY = 200;
const GESTURE_SCALE_DELAY = 600;

// Global variables

let labelX = document.getElementById('coord-x'),
	labelY = document.getElementById('coord-y'),
	mouseX = 0, mouseY = 0,
	enablePan = false;

// Free function declarations

/** Get the cookie associated with provided name.
 * @param {String} name The name of the cookie to get.
 * @param {*} value The default value returned if the cookie is not found.
 * @returns {*} Value associated with the cookie or default value.
 */
function getCookie(name, value = undefined) {
	let cookie = decodeURIComponent(document.cookie).split(';').filter(element => element.split('=')[0] === name);
	if (cookie.length) {
		console.log(cookie);
		return JSON.parse(cookie[0]);
	}
	return value;
}

/** Associate provided value with a given name cookie.
 * @param {String} name The name of the cookie.
 * @param {*} value The new value of the cookie.
 */
function putCookie(name, value) {
	document.cookie = `${name}=${JSON.stringify(value)}; expires=${Date.now() + COOKIE_TIMEOUT}`;
}

/** Set the coordinates to display provided values.
 * @param {Number} x The horizontal coordinate to display.
 * @param {Number} y The vertical coordinate to display.
 */
function displayCoordinates(x, y) {
	labelX.textContent = `X: ${x.toExponential(3)}`;
	labelY.textContent = `Y: ${y.toExponential(3)}`;
}

let canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let view = new ProceduralImageView(canvas, undefined, 1, 64, 64);

// Register events

window.addEventListener('resize', () => view.resize(window.innerWidth, window.innerHeight));

canvas.addEventListener('pointerdown', event => {
	enablePan = true;
	mouseX = event.clientX;
	mouseY = event.clientY;
});
canvas.addEventListener('pointermove', event => {
	if (enablePan) {
		view.pan(Math.round(event.clientX - mouseX), Math.round(event.clientY - mouseY));
		mouseX = event.clientX;
		mouseY = event.clientY;
	}
});
canvas.addEventListener('pointerup', () => enablePan = false);
canvas.addEventListener('pointerleave', () => enablePan = false);
canvas.addEventListener('pointercancel', () => enablePan = false);

canvas.addEventListener('wheel', event => {
	view.zoom(event.clientX, event.clientY, 1 + event.deltaY * WHEEL_SENSITIVITY, WHEEL_REDRAW_DELAY);	
});
canvas.addEventListener('gesturechange', event => {
	view.zoom(event.clientX, event.clientY, event.scale, GESTURE_SCALE_DELAY);
});
canvas.addEventListener('gestureend', event => {
	view.zoom(event.clientX, event.clientY, event.scale, GESTURE_SCALE_DELAY);
});

canvas.addEventListener('mousemove', event => {
	displayCoordinates(
		view.viewport.x + event.clientX / canvas.width * view.viewport.width,
		view.viewport.y + event.clientY / canvas.height * view.viewport.height);
});
canvas.addEventListener('mouseleave', () => {
	displayCoordinates(
		view.viewport.x + view.viewport.width*.5,
		view.viewport.y + view.viewport.height*.5);
});

view.resize(window.innerWidth, window.innerHeight);

displayCoordinates(
	view.viewport.x + view.viewport.width*.5,
	view.viewport.y + view.viewport.height*.5);

// Export function
return view;

}());
