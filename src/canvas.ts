import { ProceduralImageView } from "./ProceduralImageView";

// Constants

const WHEEL_SENSITIVITY = 1e-3;

// Global variables

let labelX = document.getElementById('coord-x') as HTMLElement,
	labelY = document.getElementById('coord-y') as HTMLElement,
	mouseX = 0, mouseY = 0,
	enablePan = false;

// Free function declarations

/** Set the coordinates to display provided values.
 * @param {number} x The horizontal coordinate to display.
 * @param {number} y The vertical coordinate to display.
 */
function displayCoordinates(x: number, y: number) {
	labelX.textContent = `X: ${x.toExponential(3)}`;
	labelY.textContent = `Y: ${y.toExponential(3)}`;
}

let canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let view = new ProceduralImageView(canvas);

// Register events

window.addEventListener('resize', () => view.resize(window.innerWidth, window.innerHeight));

canvas.addEventListener('pointerdown', event => {
	enablePan = true;
	mouseX = event.clientX;
	mouseY = event.clientY;
});
canvas.addEventListener('pointermove', event => {
	if (enablePan) {
		view.pan(Math.round(event.clientX - mouseX), Math.round(event.clientY - mouseY));
		mouseX = event.clientX;
		mouseY = event.clientY;
	}
});
canvas.addEventListener('pointerup', () => enablePan = false);
canvas.addEventListener('pointerleave', () => enablePan = false);
canvas.addEventListener('pointercancel', () => enablePan = false);

canvas.addEventListener('wheel', event => {
	view.zoom(event.clientX, event.clientY, 1 + event.deltaY * WHEEL_SENSITIVITY);	
});
// canvas.addEventListener('gesturechange', event => {
// 	view.zoom(event.clientX, event.clientY, event.scale, GESTURE_SCALE_DELAY);
// });
// canvas.addEventListener('gestureend', event => {
// 	view.zoom(event.clientX, event.clientY, event.scale, GESTURE_SCALE_DELAY);
// });

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
