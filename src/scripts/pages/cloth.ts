import type { Entity } from '@lib/engine/entity';

import { mat4, vec4 } from 'gl-matrix';

import { PerspectiveCamera } from '@lib/engine/camera';
import { Cloth, ClothSimSystem, SphereCollider } from '@lib/engine/cloth';
import { World } from '@lib/engine/entity';
import { Loop } from '@lib/engine/loop';
import { RenderSystem, Renderer } from '@lib/engine/renderer';
import { GestureDecoder } from '@lib/gesture';
import { isMobile } from '@lib/util';

function setup() {
	const canvas = document.querySelector('canvas#main') as HTMLCanvasElement;
	canvas.style.width = '100%';
	canvas.style.height = '100%';
	canvas.width = window.innerWidth * window.devicePixelRatio;
	canvas.height = window.innerHeight * window.devicePixelRatio;

	const renderer = new Renderer(canvas);
	const renderSystem = new RenderSystem(renderer);
	const world = new World<Entity>();

	window.addEventListener('resize', () => {
		renderer.resize(window.innerWidth, window.innerHeight);
		renderSystem.run(world);
	});

	// Note that the loop will setup the systems,
	// which may listen to entity added/removed events to keep track of internal resources
	// so the world needs to be populated after the loop has been set up
	const loop = new Loop(world, [renderSystem, new ClothSimSystem()]);
	populateWorld(world);

	const gd = new GestureDecoder(canvas);
	gd.addDragObserver((drag) => {
		const entity = world.with('pos', 'camera').first;
		if (!entity) return;

		const matrix = mat4.create();
		mat4.fromRotation(matrix, -drag.dx * 1e-3, [0, 1, 0]);
		mat4.rotate(matrix, matrix, -drag.dy * 1e-3, entity.camera.calcRight(entity.pos));
		const result = vec4.fromValues(...entity.pos, 1);
		vec4.transformMat4(result, result, matrix);
		entity.pos.splice(0, 3, result[0], result[1], result[2]);
	});

	window.addEventListener('keypress', (event) => {
		if (event.key === ' ') {
			loop.isRunning = !loop.isRunning;
		}
	});

	loop.isRunning = true;
}

const populateWorld = (world: World<Entity>) => {
	world.add({
		pos: [0, 1.2, -1.5],
		camera: new PerspectiveCamera(),
	});
	world.add({
		pos: [0, 0, 0],
		collider: new SphereCollider(0.5),
	});

	const particleCount = isMobile() ? 50 : 200;
	const cloth = new Cloth([0, 1, 1], particleCount);
	world.add({ pos: [0, 0, 0], cloth, mesh: cloth.mesh });

	return world;
};

window.addEventListener('load', setup, { once: true });
