import ProceduralImageView from "./lib/TiledImageView";
import { DragEvent as DragGest, ZoomEvent as ZoomGest, GestureDecoder } from "./lib/gesture";
import { displayCoordinates } from "./coordinates";

const WHEEL_SENSITIVITY = 1e-3;

type ResolveTileFn = (img: ImageData) => void;
type RejectTileFn = () => void;
type TileType = 'mandel' | 'julia';
type WorkItem = {
	x: number,
	y: number,
	resolveCb: ResolveTileFn,
	rejectCb: RejectTileFn,
};

// Global variables
let lastX = 0, lastY = 0, lastScale = 1;
let workers: Array<[Worker, ResolveTileFn, RejectTileFn]> = [];
let freePixelBuffers: Array<Uint8ClampedArray> = [];
let freeWorkers: Array<number> = [];
let workQueue: Array<WorkItem> = [];
let mandelConfig = {
	limit: 30,
	escapeRadius: 2,
};
let mandelZoom = 1;
let tile = new DOMRect();

// Free function declarations

function handleDrag(drag: DragGest) {
	if (lastX != drag.x || lastY != drag.y) {
		// cancelTiles();
		mandel.pan(Math.round(drag.x - lastX), Math.round(drag.y - lastY));
	}
	lastX = drag.x;
	lastY = drag.y;
}

function handleZoom(zoom: ZoomGest) {
	handleDrag(zoom);
	if (zoom.scale != lastScale) {
		cancelTiles();
		let dz = lastScale / zoom.scale;
		mandelZoom /= dz;
		mandel.zoom(zoom.x, zoom.y, dz);
	}
	lastScale = zoom.scale;
}

/** Get a free pixel buffer, allocating one if necessary. */
function getFreePixelBuffer() {
	let buffer = freePixelBuffers.pop();
	return buffer || new Uint8ClampedArray(mandel.tileWidth * mandel.tileHeight * 4);
}

function cancelTiles() {
	for (var i = 0; i < workQueue.length; ++i) {
		workQueue[i].rejectCb();
	}
	workQueue.length = 0;
}

/** Queue provided work for asynchronous execution.
 *
 * The work will be dispatched immediately if there are free workers or
 * deferred until a worker becomes free.
 * @param item The work to queue for execution.
 */
function queueWork(item: WorkItem) {
	let index = freeWorkers.pop();
	if (index != null) {
		let [worker] = workers[index];
		workers[index][1] = item.resolveCb;
		workers[index][2] = item.rejectCb;
		tile.x = item.x * tile.width;
		tile.y = item.y * tile.height;
		let pixels = getFreePixelBuffer();
		worker.postMessage({
			pixels: pixels.buffer,
			tile,
			zoom: mandelZoom,
			config: mandelConfig,
		}, [pixels.buffer]);
	} else {
		workQueue.push(item);
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
		workers[index][1](image);

		// Queue work once the promise is resolved
		queueMicrotask(() => {
			// Pop next work item
			let work = workQueue.shift();
			if (work != null) {
				let workerElem = workers[index];
				workerElem[1] = work.resolveCb;
				workerElem[2] = work.rejectCb;
				tile.x = work.x * tile.width;
				tile.y = work.y * tile.height;
				let pixels = getFreePixelBuffer();
				workerElem[0].postMessage({
					pixels: pixels.buffer,
					tile,
					zoom: mandelZoom,
					config: mandelConfig,
				}, [pixels.buffer]);
			} else {
				freeWorkers.push(index);
			}
		});
	};
}

// Spawn workers
for (var i = 0; i < /* navigator.hardwareConcurrency */ 1; ++i) {
	workers.push([new Worker("./cdw.js"), ()=>void(0),()=>void(0)]);
	setupWorker(i);
	freeWorkers.push(i);
}

let canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let mandel = new ProceduralImageView(canvas, (x, y) => {
	return new Promise((resolveCb, rejectCb) => queueWork({ x, y, resolveCb, rejectCb }));
});
tile.width = mandel.tileWidth;
tile.height = mandel.tileHeight;
mandelZoom = canvas.width >= canvas.height ? canvas.width / 2 : canvas.height / 2;
mandel.pan(Math.round(canvas.width / 2), Math.round(canvas.height / 2));

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
	let dz = 1 + event.deltaY * WHEEL_SENSITIVITY;
	mandelZoom /= dz;
	mandel.zoom(event.clientX, event.clientY, dz);	
});

// canvas.addEventListener('mousemove', event => {
// 	displayCoordinates(
// 		mandel.viewport.x + event.clientX / canvas.width * mandel.viewport.width,
// 		mandel.viewport.y + event.clientY / canvas.height * mandel.viewport.height);
// });
// canvas.addEventListener('mouseleave', () => {
// 	displayCoordinates(
// 		mandel.viewport.x + mandel.viewport.width*.5,
// 		mandel.viewport.y + mandel.viewport.height*.5);
// });

mandel.resize(window.innerWidth, window.innerHeight);

// displayCoordinates(
// 	mandel.viewport.x + mandel.viewport.width*.5,
// 	mandel.viewport.y + mandel.viewport.height*.5);

export { mandel, mandelConfig };
