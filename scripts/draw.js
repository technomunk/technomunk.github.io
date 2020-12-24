'use strict';
// Get global variables
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d');
let LIMIT = 32;
let SCALE = 1.2;

// Setup listening functions
// Invoke resizeCanvas() when the window is resized
window.addEventListener('resize', resizeCanvas, false);
// Perform the first invocation
resizeCanvas();

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

function mapColor(iterationCount, limit) {
	return [ (iterationCount / limit) * 255, 0, 0, ];
}

function mandelbrot(point, limit) {
	let c = [...point];
	for (var i = 0; i < limit; i++) {
		if (mag2(point) > 4) {
			return mapColor(i, limit);
		}
		point = add(sqr(point), c);
	}
	return mapColor(0, limit);
}

// Redraw the content on the canvas
function redraw() {
	let width = canvas.width;
	let height = canvas.height;
	let imageData = context.createImageData(width, height);
	let pixels = imageData.data;
	let xOffset = (height - width)*1.4;
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			let offset = (y * width + x) * 4;
			let point = [ (x*2 - height + xOffset) / height * SCALE, (y*2 - height) / height * SCALE, ];
			let pixel = mandelbrot(point, LIMIT);
            pixels[offset + 0] = pixel[0]; // red
			pixels[offset + 1] = pixel[1]; // green
			pixels[offset + 2] = pixel[2]; // blue
			pixels[offset + 3] = 255; // alpha
		}
	}
	context.putImageData(imageData, 0, 0);
}
