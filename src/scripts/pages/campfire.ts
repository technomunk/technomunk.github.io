import type { MeshBufferSet } from '@lib/engine/render/mesh';

import { mat4, vec3 } from 'gl-matrix';

import { Mesh } from '@lib/engine/render/mesh';
import { Shader } from '@lib/engine/render/shader';
import { error } from '@lib/util';

import vertex from '@shader/mvp.vs';
import fragment from '@shader/bling-phong.fs';

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
};

type MaterialUniforms = {
	uDiffuse: vec3; // diffuse color
	uSpecular: vec3; // specular color
	uShininess: number; // shininess
};
type EntityUniforms = { uModel: mat4 } & MaterialUniforms;
type Uniforms = CameraUniforms & LightUniforms & EntityUniforms;

type Attributes = 'aPos' | 'aNormal';

class CampfirePage {
	readonly gl: WebGL2RenderingContext;
	readonly shader: Shader<Uniforms, Attributes>;
	readonly buffers: MeshBufferSet<Attributes>;

	readonly view: CameraUniforms = {
		uVP: mat4.create(),
		uCameraPos: vec3.fromValues(0, 3, 5),
	};
	readonly lights: LightUniforms = {
		uLightPos: new Float32Array([...vec3.fromValues(-1, -10, -1), 0]),
		uLightCol: new Float32Array([1, 1, 1]),
		uLightCount: 1,
	};
	readonly entity: EntityUniforms = {
		uModel: mat4.create(),
		uDiffuse: vec3.fromValues(1, 0.5, 0.5),
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

		this.gl.enable(this.gl.CULL_FACE);
		this.gl.cullFace(this.gl.BACK);

		// cube mesh with normals
		// TODO: figure out typing here
		// TODO: fix interleaving
		this.buffers = detail.createCubeMesh().createVertexBuffers(this.gl);
		this.updateCamera();
		this.shader.setUniforms(this.lights);

		this.resize();
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
		this.shader.setUniforms(this.entity); // per-entity uniforms
		this.shader.draw(this.buffers);
	}

	updateCamera(): mat4 {
		const view = mat4.create();
		const projection = mat4.create();
		const aspect = this.canvas.width / this.canvas.height;
		mat4.perspective(projection, Math.PI / 4, aspect, 0.1, 100);
		mat4.lookAt(view, this.view.uCameraPos, [0, 0, 0], [0, 1, 0]);
		return mat4.multiply(this.view.uVP, projection, view);
	}

	loop(time: number) {
		this.rotation = (time / 10_000) % (Math.PI * 2);
		this.draw();
		requestAnimationFrame(this.loop.bind(this));
	}
}

namespace detail {
	export const createCubeMesh = () => {
		return new Mesh<Attributes>(
			[
				[
					'aPos',
					{
						stride: 3,
						values: new Float32Array(
							[
								// x- face
								[-0.5, -0.5, -0.5],
								[-0.5, -0.5, 0.5],
								[-0.5, 0.5, -0.5],
								[-0.5, 0.5, 0.5],
								// x+ face
								[0.5, -0.5, -0.5],
								[0.5, -0.5, 0.5],
								[0.5, 0.5, -0.5],
								[0.5, 0.5, 0.5],
								// y- face
								[-0.5, -0.5, -0.5],
								[-0.5, -0.5, 0.5],
								[0.5, -0.5, -0.5],
								[0.5, -0.5, 0.5],
								// y+ face
								[-0.5, 0.5, -0.5],
								[-0.5, 0.5, 0.5],
								[0.5, 0.5, -0.5],
								[0.5, 0.5, 0.5],
								// z- face
								[-0.5, -0.5, -0.5],
								[-0.5, 0.5, -0.5],
								[0.5, -0.5, -0.5],
								[0.5, 0.5, -0.5],
								// z+ face
								[-0.5, -0.5, 0.5],
								[-0.5, 0.5, 0.5],
								[0.5, -0.5, 0.5],
								[0.5, 0.5, 0.5],
							].flat(),
						),
					},
				],
				[
					'aNormal',
					{
						stride: 3,
						values: new Float32Array(
							[
								// normals for the cube vertices
								[-1, 0, 0],
								[-1, 0, 0],
								[-1, 0, 0],
								[-1, 0, 0],
								[1, 0, 0],
								[1, 0, 0],
								[1, 0, 0],
								[1, 0, 0],
								[0, -1, 0],
								[0, -1, 0],
								[0, -1, 0],
								[0, -1, 0],
								[0, 1, 0],
								[0, 1, 0],
								[0, 1, 0],
								[0, 1, 0],
								[0, 0, -1],
								[0, 0, -1],
								[0, 0, -1],
								[0, 0, -1],
								[0, 0, 1],
								[0, 0, 1],
								[0, 0, 1],
								[0, 0, 1],
							].flat(),
						),
					},
				],
			],
			new Uint16Array([
				//x- face
				0, 1, 2, 1, 3, 2,
				//x+ face
				4, 6, 5, 5, 6, 7,
				//y- face
				8, 10, 9, 9, 10, 11,
				//y+ face
				12, 13, 14, 14, 13, 15,
				//z- face
				16, 17, 18, 18, 17, 19,
				//z+ face
				20, 22, 21, 21, 22, 23,
			]),
		);
	};
}

const setup = () => {
	const page = new CampfirePage(document.querySelector('canvas#main') as HTMLCanvasElement);
	window.addEventListener('resize', page.resize.bind(page));
};

window.addEventListener('load', setup, { once: true });
