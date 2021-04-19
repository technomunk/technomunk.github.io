import ProceduralImageView from "./lib/ProceduralImageView";
import { DragEvent as DragGest, ZoomEvent as ZoomGest, GestureDecoder } from "./lib/gesture";
import { displayCoordinates } from "./coordinates";

const WHEEL_SENSITIVITY = 1e-3;
const PLACEHOLDER_BUFFER = new Uint8ClampedArray();

type ResolveTileFn = (img: ImageData) => void;
type RejectTileFn = () => void;

// Global variables
let lastX = 0, lastY = 0, lastScale = 1;
let workers: Array<[Worker, Uint8ClampedArray, ResolveTileFn, RejectTileFn]> = [];
let freeWorkers: Array<number> = [];
let work: Array<[DOMRect, DOMRect, ResolveTileFn, RejectTileFn]> = [];
let mandelConfig = {
	limit: 30,
	escapeRadius: 2,
};

// Free function declarations

function handleDrag(drag: DragGest) {
	if (lastX != drag.x || lastY != drag.y) {
		cancelTiles();
		mandel.pan(Math.round(drag.x - lastX), Math.round(drag.y - lastY));
	}
	lastX = drag.x;
	lastY = drag.y;
}

function handleZoom(zoom: ZoomGest) {
	handleDrag(zoom);
	if (zoom.scale != lastScale) {
		cancelTiles();
		mandel.zoom(zoom.x, zoom.y, lastScale / zoom.scale);
	}
	lastScale = zoom.scale;
}

function cancelTiles() {
	for (var i = 0; i < work.length; ++i) {
		work[i][3]();
	}
	work.length = 0;
	console.assert(work.shift() == null, "Work is not empty!");
}

function queueTile(tile: DOMRect, view: DOMRect, resolve: ResolveTileFn, reject: RejectTileFn) {
	let index = freeWorkers.pop();
	if (index != null) {
		let [worker, pixels] = workers[index];
		workers[index][2] = resolve;
		workers[index][3] = reject;
		worker.postMessage({
			pixels: pixels.buffer,
			tile: tile,
			view: view,
			config: mandelConfig,
		}, [pixels.buffer]);
	} else {
		work.push([tile, view, resolve, reject]);
	}
}

/** Setup onmessage response of workers[index] worker.
 * @param index The index of the worker within the 'workers' array to setup.
 */
function setupWorker(index: number) {
	workers[index][0].onmessage = (msg: MessageEvent<DrawRegionMessage>) => {
		// Reconstruct the image
		let pixels = new Uint8ClampedArray(msg.data.pixels);
		let image = new ImageData(pixels, msg.data.tile.width, msg.data.tile.height);
		
		// Resolve the promise
		workers[index][2](image);

		// Queue work once the promise is resolved
		queueMicrotask(() => {
			// Pop next work item
			let workItem = work.shift();
			if (workItem != null) {
				let workerElem = workers[index];
				let [tile, view, resolve, reject] = workItem;
				workerElem[2] = resolve;
				workerElem[3] = reject;
				workerElem[0].postMessage({
					pixels: pixels.buffer,
					tile: tile,
					view: view,
					config: mandelConfig,
				}, [pixels.buffer]);
			} else {
				workers[index][1] = pixels;
				freeWorkers.push(index);
			}
		});
	};
}

// Spawn workers
for (var i = 0; i < /* navigator.hardwareConcurrency */ 1; ++i) {
	// chunkW * chunkH * 4bpp
	workers.push([
		new Worker("./worker.js"),
		new Uint8ClampedArray(64*64*4),
		()=>void(0),
		()=>void(0)]);
	setupWorker(i);
	freeWorkers.push(i);
}

let canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let mandel = new ProceduralImageView(canvas, (tile, view) => {
	return new Promise((resolve, reject) => queueTile(tile, view, resolve, reject));
});

// Register events

window.addEventListener('resize', () => mandel.resize(window.innerWidth, window.innerHeight));

let gd = new GestureDecoder(canvas);
gd.on('dragstart', drag => {
	lastX = drag.x;
	lastY = drag.y;
});
gd.on('dragupdate', handleDrag);
gd.on('dragstop', handleDrag);

gd.on('zoomstart', zoom => {
	lastX = zoom.x;
	lastY = zoom.y;
	lastScale = zoom.scale;
})
gd.on('zoomupdate', handleZoom);
gd.on('zoomstop', handleZoom);

canvas.addEventListener('wheel', event => {
	cancelTiles();
	mandel.zoom(event.clientX, event.clientY, 1 + event.deltaY * WHEEL_SENSITIVITY);	
});

canvas.addEventListener('mousemove', event => {
	displayCoordinates(
		mandel.viewport.x + event.clientX / canvas.width * mandel.viewport.width,
		mandel.viewport.y + event.clientY / canvas.height * mandel.viewport.height);
});
canvas.addEventListener('mouseleave', () => {
	displayCoordinates(
		mandel.viewport.x + mandel.viewport.width*.5,
		mandel.viewport.y + mandel.viewport.height*.5);
});

mandel.resize(window.innerWidth, window.innerHeight);

displayCoordinates(
	mandel.viewport.x + mandel.viewport.width*.5,
	mandel.viewport.y + mandel.viewport.height*.5);

export { mandel, mandelConfig };
