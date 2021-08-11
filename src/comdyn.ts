/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { displayCoordinates } from "./lib/coordinates";
import { bindConfig, resetConfigs } from "./lib/draw_config";
import { GestureDecoder, DragEvent as DragGest, ZoomEvent as ZoomGest } from "./lib/gesture";
import { init_gpu_renderer } from "./lib/gpu_renderer";
import { MandelConfig, Renderer } from "./lib/irenderer";
import SideMenu from "./lib/side_menu";

// Constants

const WHEEL_SENSITIVITY = 1e-3;


// Local variables

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
let renderer: Renderer | null = null;
let lastX = 0, lastY = 0, lastScale = 0;
let drawConfig: MandelConfig | undefined;


// Function definitions

function draw() {
	if (renderer && drawConfig) {
		renderer.draw(drawConfig);
	}
}

function handleDrag(drag: DragGest) {
	if ((lastX != drag.x || lastY != drag.y) && renderer) {
		renderer.pan(drag.x - lastX, drag.y - lastY);
	}
	lastX = drag.x;
	lastY = drag.y;
}

function handleZoom(zoom: ZoomGest) {
	handleDrag(zoom);
	if (zoom.scale != lastScale && renderer) {
		renderer.zoom(zoom.x, zoom.y, lastScale / zoom.scale);
	}
	lastScale = zoom.scale;
}


// Script logic

(() => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	init_gpu_renderer(canvas, 'mandel')
		.then(r => {
			renderer = r;
			requestAnimationFrame(draw);
		});

	const gd = new GestureDecoder(canvas);
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

	canvas.addEventListener('wheel', event => renderer?.zoom(event.clientX, event.clientY, 1 + event.deltaY * WHEEL_SENSITIVITY));
	window.addEventListener('resize', () => renderer?.resize(window.innerWidth, window.innerHeight));
})();

window.onload = () => {
	new SideMenu(
		document.getElementById('side-menu')!,
		document.getElementById('toggle-menu')!,
		{ width: 400, max_rel_width: .6, });

	// Link configs
	{
		drawConfig = { limit: 0, escapeR: 0, };

		const limit = document.getElementById('limit') as HTMLInputElement;
		drawConfig.limit = Number(limit.value);
		bindConfig(limit, value => {
			drawConfig!.limit = value;
			requestAnimationFrame(draw);
		});

		const escapeR = document.getElementById('escaper') as HTMLInputElement;
		drawConfig.escapeR = Number(escapeR.value);
		bindConfig(escapeR, value => {
			drawConfig!.escapeR = value;
			requestAnimationFrame(draw);
		});
	}

	// Setup fullscreen toggle button
	{
		const button = document.getElementById("toggle_fs") as HTMLButtonElement;
		if (document.fullscreenEnabled) {
			button.onclick = () => {
				if (document.fullscreenElement) {
					document.exitFullscreen();
				} else {
					document.documentElement.requestFullscreen();
				}
			};
		} else {
			button.remove();
		}
	}

	// Setup redraw and reset buttons
	{
		document.getElementById('redraw')!.onclick = draw;
		document.getElementById('reset')!.onclick = () => {
			resetConfigs();
			if (renderer) {
				const widthToHeight = canvas.width / canvas.height;
				renderer.rect.y = -1;
				renderer.rect.height = 2;
				renderer.rect.x = -widthToHeight;
				renderer.rect.width = widthToHeight * 2;

				displayCoordinates(
					renderer.rect.x + renderer.rect.width * .5,
					renderer.rect.y + renderer.rect.height * .5);
			}
		}
	}

	// Setup coordinates
	{
		canvas.addEventListener('mousemove', event => {
			if (renderer) {
				displayCoordinates(
					renderer.rect.x + event.clientX / canvas.width * renderer.rect.width,
					renderer.rect.y + event.clientY / canvas.height * renderer.rect.height);
			}
		});
		canvas.addEventListener('mouseleave', () => {
			if (renderer) {
				displayCoordinates(
					renderer.rect.x + renderer.rect.width * .5,
					renderer.rect.y + renderer.rect.height * .5);
			}
		});

		if (renderer) {
			displayCoordinates(
				renderer.rect.x + renderer.rect.width * .5,
				renderer.rect.y + renderer.rect.height * .5);
		}
	}
};
