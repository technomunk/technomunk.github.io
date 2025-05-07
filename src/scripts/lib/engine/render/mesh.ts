import type { TypedArray } from './typeutil';
import { BufferSet, GpuBuffer, VertexBuffer } from './buffer';

export interface VertexData {
	values: TypedArray;
	stride: number;
}

export class MeshBufferSet<A extends string = string> extends BufferSet<A, VertexBuffer> {
	indices?: GpuBuffer<WebGL2RenderingContext['UNSIGNED_SHORT' | 'UNSIGNED_INT']>;
	vertexCount = 0;

	dispose(gl: WebGL2RenderingContext) {
		super.dispose(gl);
		if (this.indices) {
			this.indices.dispose(gl);
		}
	}
}

/** Collection of geometric data ready to be uploaded to the GPU for rendering */
export class Mesh<A extends string = string> extends Map<A, VertexData> {
	protected _vertexCount?: number;

	constructor(
		data: Iterable<[A, VertexData]>,
		public indices?: Uint16Array | Uint32Array,
	) {
		super(data);
		for (const {values, stride} of this.values()) {
			if (this._vertexCount && this._vertexCount !== values.length / stride) {
				throw new Error(`Vertex data ${values} has different length than existing data`);
			}
			this._vertexCount = values.length / stride;
		}
		this.indices = indices;
		if (indices) this._vertexCount = indices.length;
	}

	get vertexCount(): number {
		return this._vertexCount ?? 0;
	}

	set(name: A, value: VertexData): this {
		if (this._vertexCount && this._vertexCount !== value.values.length / value.stride) {
			throw new Error(`Vertex data ${name} has different length than existing data`);
		}
		super.set(name, value);
		if (this._vertexCount === undefined) {
			this._vertexCount = value.values.length / value.stride;
		}
		return this;
	}

	remove(name: A): boolean {
		const result = super.delete(name);
		if (this.size === 0) {
			this._vertexCount = undefined;
		}
		return result;
	}

	createVertexBuffers(gl: WebGL2RenderingContext): MeshBufferSet<A> {
		const result = new MeshBufferSet<A>();
		for (const [name, { values, stride }] of this) {
			result.set(name, new VertexBuffer(gl, values, stride));
			result.vertexCount = values.length / stride;
		}
		if (this.indices) {
			result.indices = new GpuBuffer(gl, this.indices, gl.ELEMENT_ARRAY_BUFFER);
			result.vertexCount = this.indices.length;
		}
		console.log('MeshBufferSet', result);
		return result;
	}
}
