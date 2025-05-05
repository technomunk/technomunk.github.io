import type { AttributeData, AttributeDataSet, AttributeDataType, TypedArray } from './attrib';
import type { Mesh } from './mesh';
import type { Shader } from './shader';

type NamedAttrData = [string, AttributeData];
type IndexBuffer = {
	buffer: WebGLBuffer;
	type: WebGL2RenderingContext['UNSIGNED_SHORT' | 'UNSIGNED_INT'];
};

export class MeshBufferSet {
	readonly gl: WebGL2RenderingContext;
	vao: WebGLVertexArrayObject;
	buffers: WebGLBuffer[];
	index?: IndexBuffer;
	vertexCount: number;

	constructor(shader: Shader, mesh: Mesh, interleave = true) {
		this.gl = shader.gl;
		this.vao = this.gl.createVertexArray();
		this.gl.bindVertexArray(this.vao);
		const attributes = detail.relevantAttributes(mesh.attributes, shader);
		this.buffers = interleave
			? this.createInterleavedBuffers(shader, attributes)
			: this.createSeparateBuffers(shader, attributes);
		if (mesh.indices) this.index = this.createIndexBuffer(this.gl, mesh.indices);
		this.vertexCount = mesh.indices?.length ?? detail.getVertexCount(mesh.attributes);
	}

	dispose() {
		const gl = this.gl;
		this.buffers.forEach(gl.deleteBuffer.bind(gl));
		if (this.index) {
			gl.deleteBuffer(this.index.buffer);
			this.index = undefined;
		}
		gl.deleteVertexArray(this.vao);
	}

	protected createInterleavedBuffers(shader: Shader, attributes: NamedAttrData[]): WebGLBuffer[] {
		return detail
			.collectAttributesByType(attributes)
			.entries()
			.map((attrs) => this.createInterleavedBuffer(shader, ...attrs))
			.toArray();
	}

	protected createInterleavedBuffer(
		shader: Shader,
		type: AttributeDataType,
		attrs: NamedAttrData[],
	): WebGLBuffer {
		let totalLength = 0;
		let stride = 0;
		let dataType: new (length: number) => TypedArray;
		for (const [_, { size, values }] of attrs) {
			totalLength += values.length;
			stride += size * values.BYTES_PER_ELEMENT;
			dataType = values.constructor as new (length: number) => TypedArray;
		}

		const gl = this.gl;
		const result = gl.createBuffer();
		const data = new dataType(totalLength);

		gl.bindBuffer(gl.ARRAY_BUFFER, result);
		let componentOffset = 0;
		for (const [name, { size, values }] of attrs) {
			let offset = 0;
			for (const chunk of detail.chunks(values, size)) {
				data.set(chunk, offset);
				offset += size;
			}
			const loc = shader.attributes[name];
			gl.enableVertexAttribArray(loc);
			gl.vertexAttribPointer(loc, size, type, false, stride, componentOffset);
			componentOffset += size * values.BYTES_PER_ELEMENT;
			gl.vertexAttribDivisor(loc, 0); // per vertex data
		}
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
		return result;
	}

	protected createSeparateBuffers(shader: Shader, attributes: NamedAttrData[]): WebGLBuffer[] {
		const gl = this.gl;
		return attributes.map(([name, { size, values }]) => {
			const buffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW);
			const loc = shader.attributes[name];
			gl.enableVertexAttribArray(loc);
			gl.vertexAttribPointer(loc, size, detail.inferGlTypeFromArray(values), false, 0, 0);
			gl.vertexAttribDivisor(loc, 0); // per vertex data
			return buffer;
		});
	}

	protected createIndexBuffer(
		gl: WebGL2RenderingContext,
		indices: Uint16Array | Uint32Array,
	): IndexBuffer {
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
		return { buffer, type: detail.inferGlTypeFromArray(indices) };
	}
}

namespace detail {
	export const collectAttributesByType = (attributes: NamedAttrData[]) => {
		const result = new Map<AttributeDataType, NamedAttrData[]>();
		for (const attr of attributes) {
			const type = inferGlTypeFromArray(attr[1].values);
			let array = result.get(type);
			if (!array) {
				array = new Array<NamedAttrData>();
				result.set(type, array);
			}
			array.push(attr);
		}
		return result;
	};

	export const relevantAttributes = (attributes: AttributeDataSet, shader: Shader) =>
		Object.entries(attributes).filter(([name, _]) => name in shader.attributes);

	export function inferGlTypeFromArray(array: Int8Array): WebGL2RenderingContext['BYTE'];
	export function inferGlTypeFromArray(array: Uint8Array): WebGL2RenderingContext['UNSIGNED_BYTE'];
	export function inferGlTypeFromArray(array: Uint8ClampedArray): WebGL2RenderingContext['UNSIGNED_BYTE'];
	export function inferGlTypeFromArray(array: Int16Array): WebGL2RenderingContext['SHORT'];
	export function inferGlTypeFromArray(array: Uint16Array): WebGL2RenderingContext['UNSIGNED_SHORT'];
	export function inferGlTypeFromArray(array: Int32Array): WebGL2RenderingContext['INT'];
	export function inferGlTypeFromArray(array: Uint32Array): WebGL2RenderingContext['UNSIGNED_INT'];
	export function inferGlTypeFromArray(array: Float32Array): WebGL2RenderingContext['FLOAT'];
	export function inferGlTypeFromArray(array: TypedArray): never;

	export function inferGlTypeFromArray(array) {
		if (array instanceof Int8Array) return WebGL2RenderingContext.BYTE;
		if (array instanceof Uint8Array) return WebGL2RenderingContext.UNSIGNED_BYTE;
		if (array instanceof Uint8ClampedArray) return WebGL2RenderingContext.UNSIGNED_BYTE;
		if (array instanceof Int16Array) return WebGL2RenderingContext.SHORT;
		if (array instanceof Uint16Array) return WebGL2RenderingContext.UNSIGNED_SHORT;
		if (array instanceof Int32Array) return WebGL2RenderingContext.INT;
		if (array instanceof Uint32Array) return WebGL2RenderingContext.UNSIGNED_INT;
		if (array instanceof Float32Array) return WebGL2RenderingContext.FLOAT;
		throw new Error('Array is not a TypedArray');
	}

	interface Chunkable<T> {
		get length(): number;
		slice(start: number, end?: number): ArrayLike<T>;
	}

	export function* chunks<T, S>(iterable: Chunkable<T>, chunkSize: number): Iterable<ArrayLike<T>> {
		for (let i = 0; i < iterable.length; i += chunkSize) {
			yield iterable.slice(i, i + chunkSize);
		}
	}

	export const getVertexCount = (attributes: AttributeDataSet): number => {
		const first = Object.values(attributes)[0];
		return first.values.length / first.size;
	};
}
