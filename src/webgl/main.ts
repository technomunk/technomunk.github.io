import { GestureDecoder, DragEvent as DragGest, ZoomEvent as ZoomGest } from "../lib/gesture";
import { init_gpu_renderer } from "../lib/gpu_renderer";
import SideMenu from "../lib/side_menu";

// Constants

const WHEEL_SENSITIVITY = 1e-3;


// Local variables

let renderer: Renderer | null = null;
let lastX = 0, lastY = 0, lastScale = 0;


// Function definitions

function draw() {
	if (renderer) {
		renderer.draw({});
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

(()=>{
	const canvas = document.getElementById('canvas') as HTMLCanvasElement;
	
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	init_gpu_renderer(canvas, 'mandel')
		.then(r => {
			renderer = r;
			requestAnimationFrame(draw);
		});
	
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

	canvas.addEventListener('wheel', event => renderer?.zoom(event.clientX, event.clientY, 1 + event.deltaY * WHEEL_SENSITIVITY));
	window.addEventListener('resize', () => renderer?.resize(window.innerWidth, window.innerHeight));
})();

window.onload = () => {
	const menu = new SideMenu(document.getElementById('side-menu')!, document.getElementById('toggle-menu')!);
};
