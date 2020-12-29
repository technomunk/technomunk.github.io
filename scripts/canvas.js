'use strict';

/** Redraw the contents of 'canvas' of the document. */
let redraw = (function(){

// Constants

const WORKER_COUNT = 16;
const CHUNK_WIDTH = 64;
const CHUNK_HEIGHT = 64;

// Global variables

let canvas = document.getElementById('canvas'),
	context = canvas.getContext('2d'),
	limitInput = document.getElementById('limit'),
	mouseX = 0,
	mouseY = 0,
	enablePan = false,
	workers = [],
	nextWorkerIndex = 0,
	offsetX = 0,
	offsetY = 0,
	// The space that is represented by the canvas
	viewport = { x: -1, y: -1, width: 2, height: 2, };

// Local variables

let i = 0;

// Free function declarations

/** Redraw the provided rectangle of the canvas.
 * @param {Number} limit The maximum number of iterations to perform when calculating colors.
 * @param {DOMRect} rect The rectangle of new pixels to draw. Defaults to whole canvas.
*/
function redraw(limit, rect = undefined) {
	if (rect == null) {
		rect = { x: 0, y: 0, width: canvas.width, height: canvas.height, };
	}

	let chunksX = rect.width / CHUNK_WIDTH,
		chunksY = rect.height / CHUNK_HEIGHT;

	var x = 0, y = 0, width = 0, height = 0;
	
	for (y = 0; y < chunksY; ++y) {
		height = Math.min(rect.height - y * CHUNK_HEIGHT, CHUNK_HEIGHT);
		for (x = 0; x < chunksX; ++x) {
			width = Math.min(rect.width - x * CHUNK_WIDTH, CHUNK_WIDTH);
			workers[nextWorkerIndex].postMessage({
				image: context.createImageData(width, height),
				rect: {
					x: viewport.x + ((rect.x + x * CHUNK_WIDTH) / canvas.width) * viewport.width,
					y: viewport.y + ((rect.y + y * CHUNK_HEIGHT) / canvas.height) * viewport.height,
					width: width / canvas.width * viewport.width,
					height: height / canvas.height * viewport.height,
				},
				limit: limit,
				offsetX: offsetX,
				offsetY: offsetY,
				pixelX: rect.x + x * CHUNK_WIDTH,
				pixelY: rect.y + y * CHUNK_HEIGHT,
			});
			nextWorkerIndex = (nextWorkerIndex + 1) % WORKER_COUNT;
		}
	}
}

/** Update canvas size to fill the whole window. */
function resizeCanvas() {
	let changeX = window.innerWidth / canvas.width,
		changeY = window.innerHeight / canvas.height;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	viewport.x *= changeX;
	viewport.y *= changeY;
	viewport.width *= changeX;
	viewport.height *= changeY;
	// TODO/Greg: reuse existent image
	redraw(Number(limitInput.value));
}

/** Pan the image provided number of pixels.
 * @param {Number} x The number of pixels to pan to the right.
 * @param {Number} y The number of pixels to pan to the bottom.
 */
function pan(x, y) {
	let midX = x >= 0 ? x : canvas.width + x,
		midY = y >= 0 ? y : canvas.height + y,
		limit = Number(limitInput.value),
		quadrants = [];
	
	offsetX += x;
	offsetY += y;

	viewport.x -= x / canvas.width * viewport.width;
	viewport.y -= y / canvas.height * viewport.height;

	quadrants = [
		{ x: 0, y: 0, width: midX, height: midY, },
		{ x: midX, y: 0, width: canvas.width - midX, height: midY, },
		{ x: 0, y: midY, width: midX, height: canvas.height - midY, },
		{ x: midX, y: midY, width: canvas.width - midX, height: canvas.height - midY, },
	];

	// Remove the clean quadrant.
	if (x < 0 && y < 0) {
		let imageData = context.getImageData(-x, -y, quadrants[0].width, quadrants[0].height);
		context.putImageData(imageData, 0, 0);
		quadrants.splice(0, 1);
	} else if (x >= 0 && y < 0) {
		let imageData = context.getImageData(0, -y, quadrants[1].width, quadrants[1].height);
		context.putImageData(imageData, x, 0);
		quadrants.splice(1, 1);
	} else if (x < 0 && y >= 0) {
		let imageData = context.getImageData(-x, 0, quadrants[2].width, quadrants[2].height);
		context.putImageData(imageData, 0, y);
		quadrants.splice(2, 1);
	} else if (x >= 0 && y >= 0) {
		let imageData = context.getImageData(0, 0, quadrants[3].width, quadrants[3].height);
		context.putImageData(imageData, x, y);
		quadrants.splice(3, 1);
	}

	quadrants.forEach(quad => redraw(limit, quad));
}

// Spin workers
for (i = 0; i < WORKER_COUNT; ++i) {
	workers.push(new Worker('./scripts/draw.js'));
	workers[i].onmessage = function (event) {
		context.putImageData(
			event.data.image,
			event.data.pixelX + offsetX - event.data.offsetX,
			event.data.pixelY + offsetY - event.data.offsetY);
	};
}

// Register events
window.addEventListener('resize', resizeCanvas);
canvas.addEventListener('mousedown', function(event) {
	enablePan = true;
	mouseX = event.clientX;
	mouseY = event.clientY;
});
canvas.addEventListener('mouseup', function(){ enablePan = false; });
canvas.addEventListener('mousemove', function(event) {
	if (enablePan) {
		pan(event.clientX - mouseX, event.clientY - mouseY);
		mouseX = event.clientX;
		mouseY = event.clientY;
	}
});

// Clear canvas to red
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
context.fillStyle = 'red';
context.fillRect(0, 0, canvas.width, canvas.height);
// Setup viewport
if (canvas.width < canvas.height) {
	let ratio = canvas.height / canvas.width;
	viewport = { x: -1, y: -1 * ratio, width: 2, height: 2 * ratio, };
} else {
	let ratio = canvas.width / canvas.height;
	viewport = { x: -1 * ratio, y: -1, width: 2 * ratio, height: 2, };
}
redraw(Number(limitInput.value));

// Export function
return redraw;

}());
