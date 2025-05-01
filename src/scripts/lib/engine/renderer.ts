import type { Entity, World } from './entity';
import type { Mesh } from './mesh';
import type { System, Vec3 } from './types';

import { mat4 } from 'gl-matrix';

import { error } from '@lib/util';
import { compileProgram } from '@lib/webgl/util';

import VERTEX_SHADER from '@shader/mvp.vs';
import FRAGMENT_SHADER from '@shader/solid.fs';
import type { Query, With } from 'miniplex';

interface MeshOnGPU {
	positions: WebGLBuffer;
	indices: WebGLBuffer;
}

class MeshStorage {
	readonly gl: WebGL2RenderingContext;

	protected _meshes: Map<Mesh, MeshOnGPU> = new Map();

	constructor(gl: WebGL2RenderingContext) {
		this.gl = gl;
	}

	getOrUpload(mesh: Mesh): MeshOnGPU {
		const gpuMesh = this._meshes.get(mesh);
		if (gpuMesh !== undefined) {
			if (mesh.isDirty) {
				this._uploadNewData(mesh, gpuMesh);
			}
			return gpuMesh;
		}
		return this._upload(mesh);
	}

	protected _upload(mesh: Mesh): MeshOnGPU {
		const positions = this.gl.createBuffer() || error('Failed to allocate a positions buffer');
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positions);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, mesh.positions, this.gl.STATIC_DRAW);

		const indices = this.gl.createBuffer() || error('Failed to allocate a positions buffer');
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indices);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indices, this.gl.STATIC_DRAW);

		const result: MeshOnGPU = { positions, indices };

		this._meshes.set(mesh, result);
		mesh.isDirty = false;
		return result;
	}

	protected _uploadNewData(mesh: Mesh, gpuMesh: MeshOnGPU) {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, gpuMesh.positions);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, mesh.positions, this.gl.STATIC_DRAW);
		mesh.isDirty = false;
	}
}

interface RenderMatrices {
	view: mat4;
	proj: mat4;
	vp: mat4;
	mvp: mat4;
	model: mat4;
}

interface ProgramInfo {
	program: WebGLProgram;
	attributes: { [name: string]: GLint };
	uniforms: { [name: string]: WebGLUniformLocation };
}

export class Renderer {
	protected static RENDERING_CONTEXT_OPTIONS: WebGLContextAttributes = {
		alpha: false,
		antialias: false,
		depth: true,
		desynchronized: true,
		failIfMajorPerformanceCaveat: false,
		powerPreference: 'high-performance',
		premultipliedAlpha: false,
		preserveDrawingBuffer: true,
		stencil: false,
	};

	readonly gl: WebGL2RenderingContext;
	readonly programInfo: ProgramInfo;
	readonly storage: MeshStorage;
	readonly matrices: RenderMatrices;

	constructor(canvas: HTMLCanvasElement) {
		this.gl =
			canvas.getContext('webgl2', Renderer.RENDERING_CONTEXT_OPTIONS) ||
			error('Could not instantiate drawing context');
		this.programInfo = this._setupProgram(VERTEX_SHADER, FRAGMENT_SHADER, ['iPos'], ['uMVP']);
		this.storage = new MeshStorage(this.gl);
		this.matrices = {
			view: mat4.create(),
			proj: mat4.create(),
			vp: mat4.create(),
			mvp: mat4.create(),
			model: mat4.create(),
		};
	}

	resize(width: number, height: number) {
		this.gl.canvas.width = width;
		this.gl.canvas.height = height;
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
	}

	draw(camera: With<Entity, 'pos' | 'camera'>, entities: Iterable<With<Entity, 'pos' | 'mesh'>>) {
		this.gl.clearColor(240 / 255, 174 / 255, 148 / 255, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		this.gl.useProgram(this.programInfo.program);

		camera.camera.calcView(camera.pos, this.matrices.view);
		camera.camera.calcProjection(this.aspectRatio, this.matrices.proj);
		mat4.mul(this.matrices.vp, this.matrices.proj, this.matrices.view);

		for (const { pos, mesh } of entities) {
			this._setAttributes(mesh);
			this._setUniforms(pos);
			const style = mesh.style === 'line' ? this.gl.LINES : this.gl.TRIANGLES;
			this.gl.drawElements(style, mesh.indices.length, this.gl.UNSIGNED_SHORT, 0);
		}

		this.gl.flush();
	}

	get aspectRatio(): number {
		return this.gl.canvas.width / this.gl.canvas.height;
	}

	protected _setupProgram(
		vertex: string,
		fragment: string,
		attributeNames: Array<string>,
		uniformNames: Array<string>,
	): ProgramInfo {
		const program = compileProgram(this.gl, vertex, fragment);

		const attributes: { [name: string]: GLint } = {};
		for (const name of attributeNames) {
			const location = this.gl.getAttribLocation(program, name);
			if (location === -1) {
				console.error(`Couldn't find the "${name}" attribute location`);
				continue;
			}
			console.debug(`Found "${name}" attribute at ${location}`);
			attributes[name] = location;
		}

		const uniforms: { [name: string]: WebGLUniformLocation } = {};
		for (const name of uniformNames) {
			const location =
				this.gl.getUniformLocation(program, name) ||
				error(`Couldn't find the "${name}" uniform location`);
			uniforms[name] = location;
		}
		return {
			program,
			uniforms,
			attributes,
		};
	}

	protected _setAttributes(mesh: Mesh) {
		const gpuMesh = this.storage.getOrUpload(mesh);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, gpuMesh.positions);
		this.gl.vertexAttribPointer(this.programInfo.attributes.aPos, 3, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(this.programInfo.attributes.aPos);

		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, gpuMesh.indices);
	}

	protected _setUniforms(pos: Vec3) {
		mat4.fromTranslation(this.matrices.model, pos);
		mat4.mul(this.matrices.mvp, this.matrices.vp, this.matrices.model);
		this.gl.uniformMatrix4fv(this.programInfo.uniforms.uMVP, false, this.matrices.mvp);
	}
}

export class RenderSystem implements System {
	constructor(public readonly renderer: Renderer) {}

	run(world: World<Entity>, dt: number): void {
		const camera = world.with('pos', 'camera').first;
		if (!camera) {
			console.error('No camera to render from');
			return;
		}

		this.renderer.draw(camera, world.with('pos', 'mesh'));
	}
}
