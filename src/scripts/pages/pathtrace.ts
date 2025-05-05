import { GestureDecoder } from '@lib/gesture';
import { Mat3, Vec3 } from '@lib/math';
import FragmentRenderer from '@lib/webgl/fragment';
import { composeUniformSetters, setUniforms, setupCubemap } from '@lib/webgl/util';

import PATHTRACE_SHADER from '@shader/pathtrace.fs';

function setup() {
	// const canvas = new OffscreenCanvas(
	//     Math.ceil(window.innerWidth * ratio),
	//     Math.ceil(window.innerHeight * ratio),
	// )
	const canvas = document.querySelector('canvas#main') as HTMLCanvasElement;

	const renderer = new FragmentRenderer(canvas);

	renderer.setShader(PATHTRACE_SHADER);
	const setters = composeUniformSetters(renderer.context, renderer.program);

	function resize() {
		const width = window.innerWidth * window.devicePixelRatio;
		const height = window.innerHeight * window.devicePixelRatio;
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.width = width;
		canvas.height = height;
		renderer.context.viewport(0, 0, width, height);

		setUniforms(setters, { uResolution: [width, height] });
	}
	resize();

	let pos = new Vec3(2, 0.16, 0.2);
	let fov = Math.PI / 5;
	if (canvas.width < canvas.height) {
		fov *= canvas.height / canvas.width;
	}

	setUniforms(setters, {
		uCamPos: pos,
		uView: Mat3.lookIn(Vec3.ZERO.sub(pos).normalize()),
		uCamFov: fov,
		uSkybox: setupCubemap(renderer.context, { onComplete: () => renderer.draw() }),
	});

	const gd = new GestureDecoder(canvas);

	gd.addDragObserver((d) => {
		pos = pos.rotate(Vec3.Y, (d.dx / window.innerWidth) * Math.PI);
		pos = pos.rotate(Vec3.cross(pos, Vec3.Y).normalize(), (d.dy / window.innerHeight) * Math.PI);
		console.debug(pos);
		setUniforms(setters, {
			uCamPos: pos,
			uView: Mat3.lookIn(Vec3.ZERO.sub(pos).normalize()),
		});
		renderer.draw();
	});

	window.addEventListener('resize', () => {
		resize();
		renderer.draw();
	});
	window.addEventListener('keypress', (e) => {
		if (e.key === ' ') {
			renderer.draw();
		}
	});
	window.addEventListener('wheel', (e) => {
		if (e.deltaY < 0 && pos.norm2() < 4) {
			return;
		}
		pos.muli(1 + e.deltaY / 1000);
		setUniforms(setters, { uCamPos: pos });
		renderer.draw();
	});
}

window.addEventListener('load', setup, { once: true });
