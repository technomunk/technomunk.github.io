import { mat4 } from 'gl-matrix';

import { Mesh } from '@lib/engine/render/mesh';
import { MeshBufferSet } from '@lib/engine/render/mesh-buffer';
import { Shader } from '@lib/engine/render/shader';
import { error } from '@lib/util';

// import vertex from '@shader/mvp.vs';
// import fragment from '@shader/normal-as-color.fs';

import vertex from '@shader/identity.vs';
import fragment from '@shader/color.fs';

type Uniforms = {
	uVP: mat4; // view projection matrix
	uModel: mat4; // model matrix
};

class CampfirePage {
	readonly gl: WebGL2RenderingContext;
	readonly shader: Shader<Uniforms>;
	readonly buffers: MeshBufferSet;

	readonly viewProjectionMatrix: mat4 = mat4.create();
	readonly modelMatrix: mat4 = mat4.create();

	constructor(public readonly canvas: HTMLCanvasElement) {
		this.gl = this.canvas.getContext('webgl2') || error('WebGL2 is not available!');
		this.shader = new Shader({
			gl: this.gl,
			src: { vertex, fragment },
		});
		this.shader.use();

		// cube mesh with normals
		// TODO: figure out typing here
		// TODO: fix interleaving
		this.buffers = new MeshBufferSet(this.shader, this.createQuadMesh(), false);
		this.updateViewProjectionMatrix();
		mat4.identity(this.modelMatrix);

		this.resize();
	}

	resize() {
		const w = window.innerWidth * window.devicePixelRatio;
		const h = window.innerHeight * window.devicePixelRatio;
		this.canvas.style.width = '100%';
		this.canvas.style.height = '100%';
		this.canvas.width = w;
		this.canvas.height = h;
		this.gl.viewport(0, 0, w, h);

		this.updateViewProjectionMatrix();

		this.draw();
	}

	draw() {
		this.gl.clearColor(0, 0, 0.3, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		// this.shader.setUniforms({
		// 	uVP: this.viewProjectionMatrix,
		// }); // per-frame uniforms
		// // set entity uniforms
		// this.shader.setUniforms({
		// 	uModel: this.modelMatrix,
		// });
		// draw entity
		this.shader.draw(this.buffers, this.gl.TRIANGLE_FAN);
	}

	createQuadMesh(): Mesh {
		return new Mesh({
			aPos: {
				size: 2,
				values: new Float32Array(
					[
						// z-face
						[-0.5, -0.5],
						[0.5, -0.5],
						[0.5, 0.5],
						[-0.5, 0.5],
					].flat(),
				),
			},
			aColor: {
				size: 4,
				values: new Float32Array(
					[
						// z-face
						[1, 0, 0, 1],
						[0, 1, 0, 1],
						[0, 0, 1, 1],
						[1, 1, 0, 1],
					].flat(),
				),
			},
		});
	}

	createCubeMesh(): Mesh {
		return new Mesh(
			{
				aPos: {
					size: 3,
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
				aNormal: {
					size: 3,
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
			},
			new Uint16Array([
				//x- face
				0, 1, 2, 2, 1, 3,
				//x+ face
				4, 5, 6, 6, 5, 7,
				//y- face
				8, 9, 10, 10, 9, 11,
				//y+ face
				12, 13, 14, 14, 13, 15,
				//z- face
				16, 17, 18, 18, 17, 19,
				//z+ face
				20, 21, 22, 22, 21, 23,
			]),
		);
	}

	updateViewProjectionMatrix(): mat4 {
		const view = mat4.create();
		const projection = mat4.create();
		const aspect = this.canvas.width / this.canvas.height;
		mat4.perspective(projection, Math.PI / 4, aspect, 0.1, 100);
		mat4.lookAt(view, [0, 0, 2], [0, 0, 0], [0, 1, 0]);
		return mat4.multiply(this.viewProjectionMatrix, projection, view);
	}
}

const setup = () => {
	const page = new CampfirePage(document.querySelector('canvas#main') as HTMLCanvasElement);
	window.addEventListener('resize', page.resize.bind(page));
};

window.addEventListener('load', setup, { once: true });
