// let vertexShader = fetch('shaders/identity.vs');

import { deserialize } from "node:v8";
import { GestureDecoder, DragEvent as DragGest, ZoomEvent as ZoomGest } from "../lib/gesture";
import SideMenu from "../lib/side_menu";
import createViewer from "./viewer";

const WHEEL_SENSITIVITY = -1e-3;

function setupMandelbrot(fragment: string) {
	let canvas = document.getElementById('canvas') as HTMLCanvasElement;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	let viewer = createViewer(canvas, fragment, { uRes: null, uRect: null, uLimit: null, uLimitColor: null });

	if (viewer == null) {
		alert("Failed to setup WebGL :(");
		return;
	}

	const limit = document.getElementById('limit') as HTMLInputElement;
	
	const widthToHeight = canvas.width / canvas.height;
	let rect = new DOMRect(-1*widthToHeight, -1, 2*widthToHeight, 2);

	viewer.set('uRes', canvas.width, canvas.height);
	viewer.set('uRect', rect.x, rect.y, rect.width, rect.height);
	viewer.seti('uLimit', Number(limit.value));
	viewer.set('uLimitColor', 0, 0, 0, 1);

	viewer.requestDraw();

	window.addEventListener('resize', () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		if (viewer != null) {
			const widthToHeight = canvas.width / canvas.height;
			rect.x = -1*widthToHeight;
			rect.y = -1;
			rect.width = 2*widthToHeight;
			rect.height = 2;

			viewer.set('uRes', canvas.width, canvas.height);
			viewer.set('uRect', rect.x, rect.y, rect.width, rect.height);
			viewer.requestDraw();
		}
	});

	limit.addEventListener('input', () => {
		viewer!.seti('uLimit', Number(limit.value));
		viewer!.requestDraw();
	});

	const panView = (dx: number, dy: number) => {
		rect.x -= dx / canvas.width * rect.width;
		rect.y += dy / canvas.height * rect.height;
		viewer!.set('uRect', rect.x, rect.y, rect.width, rect.height);
		viewer!.requestDraw();
	};
	const zoomView = (x: number, y: number, scale: number) => {
		const nx = x / canvas.width;
		const ny = 1 - y / canvas.height;
		// The relative points x+nx*w should stay the same after scaling
		const invScale = 1 / scale;
		rect.x += rect.width * nx * (1 - invScale);
		rect.y += rect.height * ny * (1 - invScale);
		rect.width /= scale;
		rect.height /= scale;
		viewer!.set('uRect', rect.x, rect.y, rect.width, rect.height);
		viewer!.requestDraw();
	};

	let gestureDecoder = new GestureDecoder(canvas);
	let lastX = 0, lastY = 0;
	const handleDrag = (drag: DragGest) => {
		const dx = drag.x - lastX, dy = drag.y - lastY;
		if (dx != 0 || dy != 0) {
			panView(dx, dy);
		}
		lastX = drag.x;
		lastY = drag.y;
	};

	let lastScale = 1;
	const handleZoom = (zoom: ZoomGest) => {
		handleDrag(zoom);
		if (lastScale != zoom.scale) {
			const dz = zoom.scale / lastScale;
			zoomView(zoom.x, zoom.y, dz);
		}
		lastScale = zoom.scale;
	};

	gestureDecoder.on('dragstart', ({ x, y }) => { lastX = x; lastY = y; });
	gestureDecoder.on('dragupdate', handleDrag);
	gestureDecoder.on('dragstop', handleDrag);

	gestureDecoder.on('zoomstart', ({ x, y, scale }) => {
		lastX = x, lastY = y;
		lastScale = scale;
	});
	gestureDecoder.on('zoomupdate', handleZoom);
	gestureDecoder.on('zoomstop', handleZoom);

	canvas.addEventListener('wheel', ({ x, y, deltaY }) => {
		const dz = 1 + deltaY * WHEEL_SENSITIVITY;
		zoomView(x, y, dz);
	});

	return viewer;
}

fetch('shaders/mandel.fs')
	.then(response => response.text())
	.then(src => setupMandelbrot(src));

window.onload = () => {
	const menu = new SideMenu(document.getElementById('side-menu')!, document.getElementById('toggle-menu')!);
};
