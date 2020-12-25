'use strict';

// Declare constants

const SIXTH = 1 / 6;
const SCALE = 1.2;

// Get global variables

let canvas = document.getElementById('mainCanvas');
let context = canvas.getContext('2d');

// Function to be invoked whenever the canvas needs to be resized
function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	redraw();
}

// Add 2 complex numbers together
function add(a, b) {
	return [ a[0] + b[0], a[1] + b[1], ];
}

// Square (multiply by itself) a complex number
function sqr(c) {
	return [ c[0]*c[0] - c[1]*c[1], 2*c[0]*c[1], ];
}

// Get the square magnitude of a complex number
function mag2(c) {
	return c[0]*c[0] + c[1]*c[1];
}

// Declare functions

// Translates a hue value to a fully saturated RGB value using
// https://www.rapidtables.com/convert/color/hsv-to-rgb.html
// Expects normalized hue value.
function hueToRgb(hue) {
	if (hue < SIXTH) {
		return [ 255, hue / SIXTH * 255, 0, ];
	} else if (hue < 2*SIXTH) {
		return [ (2 - hue/SIXTH) * 255, 255, 0, ];
	} else if (hue < 3*SIXTH) {
		return [ 0, 255, (hue - 2*SIXTH) / SIXTH * 255, ];
	} else if (hue < 4*SIXTH) {
		return [ 0, (2 - (hue - 2*SIXTH) / SIXTH) * 255, 255, ];
	} else if (hue < 5*SIXTH) {
		return [ (hue - 4*SIXTH) / SIXTH * 255, 0, 255, ];
	} else {
		return [ 255, 0, (2 - (hue - 4*SIXTH)/SIXTH) * 255, ];
	}
}

function mapColor(iterationCount, limit) {
	if (iterationCount == -1) {
		return [ 0, 0, 0, ];
	}
	return hueToRgb(iterationCount / limit);
}

function mandelbrot(point, limit) {
	let c = [...point];
	for (var i = 0; i < limit; i++) {
		if (mag2(point) > 4) {
			return mapColor(i, limit);
		}
		point = add(sqr(point), c);
	}
	return mapColor(-1, limit);
}

// Redraw the content on the canvas
function redraw() {
	let width = canvas.width;
	let height = canvas.height;
	let limit = limitSlider.value;
	let imageData = context.createImageData(width, height);
	let pixels = imageData.data;
	let xOffset = (height - width)*1.4;

	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			let offset = (y * width + x) * 4;
			let point = [ (x*2 - height + xOffset) / height * SCALE, (y*2 - height) / height * SCALE, ];
			let pixel = mandelbrot(point, limit);
            pixels[offset + 0] = pixel[0]; // red
			pixels[offset + 1] = pixel[1]; // green
			pixels[offset + 2] = pixel[2]; // blue
			pixels[offset + 3] = 255; // alpha
		}
	}
	context.putImageData(imageData, 0, 0);
}

// Run setup

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
