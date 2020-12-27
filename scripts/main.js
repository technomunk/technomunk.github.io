'use strict';

/**
 * Redraw the contents of 'mainCanvas' of the document.
 */
let redraw = (function(){

// Constants

const WORKER_COUNT = 16;
const CHUNK_WIDTH = 64;
const CHUNK_HEIGHT = 64;

// Global variables

let canvas = document.getElementById('mainCanvas'),
	context = canvas.getContext('2d'),
	limit = document.getElementById('limitSlider'),
	workers = [];

// Local variables

let i = 0;

// Free function declarations

/** Update canvas size to fill the whole window.
 */
function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	context.fillStyle = 'red';
	context.fillRect(0, 0, canvas.width, canvas.height);
	redraw();
}

/** Redraw the whole contents of the canvas.
 */
function redraw() {
	let chunksX = Math.ceil(canvas.width / CHUNK_WIDTH),
		chunksY = Math.ceil(canvas.height / CHUNK_HEIGHT);

	var y = 0,
		x = 0;
	
	for (y = 0; y < chunksY; ++y) {
		for (x = 0; x < chunksX; ++x) {
			workers[(y*chunksX + x) % WORKER_COUNT].postMessage({
				image: context.createImageData(CHUNK_WIDTH, CHUNK_HEIGHT),
				rect: { x: x * CHUNK_WIDTH, y: y * CHUNK_HEIGHT, width: CHUNK_WIDTH, height: CHUNK_HEIGHT },
				canvasWidth: canvas.width,
				canvasHeight: canvas.height,
				limit: Number(limitSlider.value),
			});
		}
	}
}

// Run setup

for (i = 0; i < WORKER_COUNT; ++i) {
	workers.push(new Worker('./scripts/draw.js'));
	workers[i].onmessage = function (event) {
		context.putImageData(event.data[0], event.data[1].x, event.data[1].y);
	};
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Export function
return redraw;

}());
