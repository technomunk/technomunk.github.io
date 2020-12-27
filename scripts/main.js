'use strict';

// Declare constants

const WORKER_COUNT = 16;
const CHUNK_X = 64;
const CHUNK_Y = 64;

// Set global variables

let canvas = document.getElementById('mainCanvas');
let context = canvas.getContext('2d');
let limitSlider = document.getElementById('limitSlider');
let workers = [];

// Function to be invoked whenever the canvas needs to be resized
function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	context.fillStyle = 'red';
	context.fillRect(0, 0, canvas.width, canvas.height);
	redraw();
}

function putImage(image, rect) {
	context.putImageData(image, rect.x, rect.y);
}

// Redraw the content on the canvas
function redraw() {
	let chunksX = Math.ceil(canvas.width / CHUNK_X);
	let chunksY = Math.ceil(canvas.height / CHUNK_Y);
	for (var y = 0; y < chunksY; ++y) {
		for (var x = 0; x < chunksX; ++x) {
			workers[(y*chunksX + x) % WORKER_COUNT].postMessage({
				image: context.createImageData(CHUNK_X, CHUNK_Y),
				rect: new DOMRect(x * CHUNK_X, y * CHUNK_Y, CHUNK_X, CHUNK_Y),
				canvasWidth: canvas.width,
				canvasHeight: canvas.height,
				limit: Number(limitSlider.value),
			});
		}
	}
}

// Run setup

for (var i = 0; i < WORKER_COUNT; ++i) {
	workers.push(new Worker('./scripts/draw.js'));
	workers[i].onmessage = function (event) {
		putImage(event.data[0], event.data[1]);
	};
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
