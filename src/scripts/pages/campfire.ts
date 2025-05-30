import type { MeshBufferSet } from '@lib/engine/render/mesh';

import { mat4, vec3 } from 'gl-matrix';

import { Shader } from '@lib/engine/render/shader';
import { error } from '@lib/util';

import campfireUrl from '@assets/mesh/campfire.glb?url';
import sceneUrl from '@assets/mesh/campfire-scene.glb?url';

import vertex from '@shader/mvp.vs';
import fragment from '@shader/bling-phong.fs';
import { hexToRgb } from '@lib/engine/color';
import { importGltfMesh, importGltfScene } from '@lib/engine/gltf';

// import vertex from '@shader/identity.vs';
// import fragment from '@shader/color.fs';

type CameraUniforms = {
	uVP: mat4; // view projection matrix
	uCameraPos: vec3; // camera position
};
type LightUniforms = {
	uLightPos: Float32Array; // light positions
	uLightCol: Float32Array; // light color
	uLightCount: number; // light color
	uAmbient: Float32Array; // ambient color
};

type MaterialUniforms = {
	uDiffuse: vec3; // diffuse color
	uSpecular: vec3; // specular color
	uShininess: number; // shininess
};
type EntityUniforms = { uModel: mat4 } & MaterialUniforms;
type Uniforms = CameraUniforms & LightUniforms & EntityUniforms;

type Attributes = 'aPos' | 'aNorm';

class CampfirePage {
	readonly gl: WebGL2RenderingContext;
	readonly shader: Shader<Uniforms, Attributes>;
	buffers?: MeshBufferSet<Attributes>;

	readonly view: CameraUniforms = {
		uVP: mat4.create(),
		uCameraPos: vec3.fromValues(0, 1, 3),
	};
	readonly lights: LightUniforms = {
		uLightPos: new Float32Array([...vec3.fromValues(-1, -10, -1), 0]),
		uLightCol: new Float32Array([1, 1, 1]),
		uLightCount: 1,
		uAmbient: new Float32Array([0.1, 0.1, 0.1]),
	};
	readonly entity: EntityUniforms = {
		uModel: mat4.create(),
		uDiffuse: hexToRgb('#3b270c'),
		uSpecular: vec3.fromValues(1, 1, 1),
		uShininess: 32,
	};

	rotation = 0;

	constructor(public readonly canvas: HTMLCanvasElement) {
		this.gl = this.canvas.getContext('webgl2') || error('WebGL2 is not available!');
		this.shader = new Shader({
			gl: this.gl,
			src: { vertex, fragment },
		});
		this.shader.use();

		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.enable(this.gl.CULL_FACE);
		this.gl.cullFace(this.gl.BACK);

		// TODO: fix interleaving
		this.updateCamera();
		this.shader.setUniforms(this.lights);

		this.resize();

		this.fetchMeshes();
		this.loop(performance.now());
	}

	resize() {
		const w = window.innerWidth * window.devicePixelRatio;
		const h = window.innerHeight * window.devicePixelRatio;
		this.canvas.style.width = '100%';
		this.canvas.style.height = '100%';
		this.canvas.width = w;
		this.canvas.height = h;
		this.gl.viewport(0, 0, w, h);

		this.updateCamera();
	}

	draw() {
		this.gl.clearColor(0, 0, 0.3, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		mat4.fromRotation(this.entity.uModel, this.rotation, [0, 1, 0]);

		this.shader.setUniforms(this.view); // per-frame uniforms
		if (this.buffers) {
			this.shader.setUniforms(this.entity); // per-entity uniforms
			this.shader.draw(this.buffers);
		}
	}

	updateCamera(): mat4 {
		const view = mat4.create();
		const projection = mat4.create();
		const aspect = this.canvas.width / this.canvas.height;
		mat4.perspective(projection, Math.PI / 6, aspect, 0.1, 100);
		mat4.lookAt(view, this.view.uCameraPos, [0, 0, 0], [0, 1, 0]);
		return mat4.multiply(this.view.uVP, projection, view);
	}

	loop(time: number) {
		this.rotation = (time / 10_000) % (Math.PI * 2);
		this.draw();
		requestAnimationFrame(this.loop.bind(this));
	}

	async fetchMeshes() {
		const mesh = await importGltfMesh<Attributes>(campfireUrl, 'Campfire', {
			aPos: 'POSITION',
			aNorm: 'NORMAL',
		});
		this.buffers = mesh.createVertexBuffers(this.gl);
		const scene = await importGltfScene<Attributes>(
			sceneUrl,
			{
				aPos: 'POSITION',
				aNorm: 'NORMAL',
			},
			{
				uDiffuse: 'base',
				uRoughness: 'roughness',
			},
		);
		console.log('Scene loaded:', scene);
	}
}

const setup = () => {
	const page = new CampfirePage(document.querySelector('canvas#main') as HTMLCanvasElement);
	window.addEventListener('resize', page.resize.bind(page));
};

window.addEventListener('load', setup, { once: true });
