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
const COOKIE_NAME_COORD = 'coords';
const COOKIE_NAME_LIMIT = 'limit';
const COOKIE_TIMEOUT = 24*60*60*1000;

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

let i = 0,
	coords = [ 0, 0, 2, 2, ];

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

/** Update the coordinate cookie to reflect current viewport. */
function refreshCoordCookie() {
	coords = [
		viewport.x + viewport.width * .5,
		viewport.y + viewport.height * .5,
		viewport.width,
		viewport.height,
	];
	putCookie(COOKIE_NAME_COORD, coords);
}

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
	
	if (lastLimit != limit) {
		lastLimit = limit;
		putCookie(COOKIE_NAME_LIMIT, lastLimit);
	}

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
	context.fillStyle = 'red';
	context.fillRect(0, 0, canvas.width, canvas.height);
	refreshCoordCookie();
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

	refreshCoordCookie();

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

	if (scale > 1) {
		let invScale = 1 / scale;
		context.drawImage(
			canvas,
			canvas.width * relX - canvas.width * relX * invScale,
			canvas.height * relY - canvas.height * relY * invScale,
			canvas.width * invScale,
			canvas.height * invScale);
	} else {
		// Possible optimization: only redraw the rectangles around
		context.drawImage(
			canvas,
			canvas.width * relX - canvas.width * relX * scale,
			canvas.height * relY - canvas.height * relY * scale,
			canvas.width * scale,
			canvas.height * scale,
			0,
			0,
			canvas.width,
			canvas.height);
	}

	window.clearTimeout(redrawTimer);
	redrawTimer = setTimeout(() => redraw(lastLimit), delay);

	refreshCoordCookie();
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
canvas.addEventListener('pointermove', event => {
	if (enablePan) {
		pan(event.clientX - mouseX, event.clientY - mouseY);
		mouseX = event.clientX;
		mouseY = event.clientY;
	}
});
canvas.addEventListener('pointerup', () => enablePan = false);
canvas.addEventListener('pointerleave', () => enablePan = false);
canvas.addEventListener('pointercancel', () => enablePan = false);

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
document.getElementById('reset').onclick = () => {
	offsetX = 0;
	offsetY = 0;
	coords = [0, 0, 2, 2];
	lastLimit = 30;
	document.getElementById('limit').value = lastLimit;
	if (canvas.width < canvas.height) {
		let ratio = canvas.height / canvas.width;
		viewport = {
			x: coords[0] - coords[2] * .5,
			y: (coords[0] - coords[2] * .5) * ratio,
			width: coords[2],
			height: coords[2] * ratio,
		};
	} else {
		let ratio = canvas.width / canvas.height;
		viewport = {
			x: (coords[1] - coords[3] * .5) * ratio,
			y: coords[1] - coords[3] * .5,
			width: coords[3] * ratio,
			height: coords[3],
		};
	}
	refreshCoordCookie();
	putCookie(COOKIE_NAME_LIMIT, lastLimit);
	redraw(lastLimit);
};

// Clear canvas to red
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
context.fillStyle = 'red';
context.fillRect(0, 0, canvas.width, canvas.height);
// Setup viewport
coords = getCookie(COOKIE_NAME_COORD, [0, 0, 2, 2]);
lastLimit = getCookie(COOKIE_NAME_LIMIT, Number(document.getElementById('limit').value));
if (canvas.width < canvas.height) {
	let ratio = canvas.height / canvas.width;
	viewport = {
		x: coords[0] - coords[2] * .5,
		y: (coords[0] - coords[2] * .5) * ratio,
		width: coords[2],
		height: coords[2] * ratio,
	};
} else {
	let ratio = canvas.width / canvas.height;
	viewport = {
		x: (coords[1] - coords[3] * .5) * ratio,
		y: coords[1] - coords[3] * .5,
		width: coords[3] * ratio,
		height: coords[3],
	};
}
refreshCoordCookie();
putCookie(COOKIE_NAME_LIMIT, lastLimit);
redraw(lastLimit);

labelX.textContent = `X: ${viewport.x + viewport.width*.5}`;
labelY.textContent = `Y: ${viewport.y + viewport.height*.5}`;

// Export function
return redraw;

}());
