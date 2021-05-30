import ProceduralImageView from "./ProceduralImageView";
import { DragEvent as DragGest, ZoomEvent as ZoomGest, GestureDecoder } from "../lib/gesture";
import { displayCoordinates } from "../lib/coordinates";

// Constants

const WHEEL_SENSITIVITY = 1e-3;

// Global variables
let lastX = 0, lastY = 0, lastScale = 1;

// Free function declarations

function handleDrag(drag: DragGest) {
	if (lastX != drag.x || lastY != drag.y) {
		view.pan(Math.round(drag.x - lastX), Math.round(drag.y - lastY));
	}
	lastX = drag.x;
	lastY = drag.y;
}

function handleZoom(zoom: ZoomGest) {
	handleDrag(zoom);
	if (zoom.scale != lastScale) {
		view.zoom(zoom.x, zoom.y, lastScale / zoom.scale);
	}
	lastScale = zoom.scale;
}

let canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let view = new ProceduralImageView(canvas);

// Register events

window.addEventListener('resize', () => view.resize(window.innerWidth, window.innerHeight));

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
	view.zoom(event.clientX, event.clientY, 1 + event.deltaY * WHEEL_SENSITIVITY);	
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

export { view };
