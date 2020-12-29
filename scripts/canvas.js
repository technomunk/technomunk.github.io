'use strict';

/** Redraw the contents of 'canvas' of the document. */
let redraw = (function(){

// Constants

const WORKER_COUNT = 16;
const CHUNK_WIDTH = 64;
const CHUNK_HEIGHT = 64;
const WHEEL_SENSITIVITY = 1e-3;
const WHEEL_REDRAW_DELAY = 100;
const GESTURE_SCALE_DELAY = 600;

// Global variables

let canvas = document.getElementById('canvas'),
	context = canvas.getContext('2d'),
	labelX = document.getElementById('coord-x'),
	labelY = document.getElementById('coord-y'),
	lastLimit = 0,
	mouseX = 0,
	mouseY = 0,
	enablePan = false,
	workers = [],
	nextWorkerIndex = 0,
	offsetX = 0,
	offsetY = 0,
	// The space that is represented by the canvas
	viewport = { x: -1, y: -1, width: 2, height: 2, },
	redrawTimer = 0;

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
	
	lastLimit = limit;

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
				viewport: viewport,
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
	redraw(lastLimit);
}

/** Pan the image provided number of pixels.
 * @param {Number} x The number of pixels to pan to the right.
 * @param {Number} y The number of pixels to pan to the bottom.
 */
function pan(x, y) {
	let midX = x >= 0 ? x : canvas.width + x,
		midY = y >= 0 ? y : canvas.height + y,
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

	quadrants.forEach(quad => redraw(lastLimit, quad));
}

/** Zoom the picture in or out around pixel at {x, y}.
 * @param {Number} x The horizontal coordinate of the point being zoomed around.
 * @param {Number} y The vertical coordinate of the point being zoomed around.
 * @param {Number} scale The scaling of the zoom.
 * @param {Number} delay The number of milliseconds to wait before redrawing the picture.
 */
function zoom(x, y, scale, delay = 0) {
	let relX = x / canvas.width,
		relY = y / canvas.height,
		pointX = viewport.x + viewport.width * relX,
		pointY = viewport.y + viewport.height * relY;
	
	viewport.width *= scale;
	viewport.height *= scale;
	viewport.x = pointX - viewport.width * relX;
	viewport.y = pointY - viewport.height * relY;

	window.clearTimeout(redrawTimer);
	redrawTimer = setTimeout(() => redraw(lastLimit), delay);
}

// Perform initialization

// Spin workers
for (i = 0; i < WORKER_COUNT; ++i) {
	workers.push(new Worker('./scripts/draw.js'));
	workers[i].onmessage = event => {
		if (event.data.limit == lastLimit
			&& event.data.viewport.width == viewport.width
			&& event.data.viewport.height == viewport.height)
		{
			context.putImageData(
				event.data.image,
				event.data.pixelX + offsetX - event.data.offsetX,
				event.data.pixelY + offsetY - event.data.offsetY);
		}
	};
}

// Register events

window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('pointerdown', event => {
	enablePan = true;
	mouseX = event.clientX;
	mouseY = event.clientY;
});
canvas.addEventListener('pointerup', () => { enablePan = false; });
canvas.addEventListener('pointermove', event => {
	if (enablePan) {
		pan(event.clientX - mouseX, event.clientY - mouseY);
		mouseX = event.clientX;
		mouseY = event.clientY;
	}
});

canvas.addEventListener('wheel', event => {
	zoom(event.clientX, event.clientY, 1 + event.deltaY * WHEEL_SENSITIVITY, WHEEL_REDRAW_DELAY);	
});
canvas.addEventListener('gesturechange', event => {
	zoom(event.clientX, event.clientY, event.scale, GESTURE_SCALE_DELAY);
});
canvas.addEventListener('gestureend', event => {
	zoom(event.clientX, event.clientY, event.scale);
});

canvas.addEventListener('mousemove', event => {
	labelX.textContent = `X: ${viewport.x + event.clientX / canvas.width * viewport.width}`;
	labelY.textContent = `Y: ${viewport.y + event.clientY / canvas.height * viewport.height}`;
});
canvas.addEventListener('mouseleave', () => {
	labelX.textContent = `X: ${viewport.x + viewport.width*.5}`;
	labelY.textContent = `Y: ${viewport.y + viewport.height*.5}`;
});

document.getElementById('redraw').onclick = () => redraw(lastLimit);

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
redraw(Number(document.getElementById('limit').value));

labelX.textContent = `X: ${viewport.x + viewport.width*.5}`;
labelY.textContent = `Y: ${viewport.y + viewport.height*.5}`;

// Export function
return redraw;

}());
