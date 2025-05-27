import type { TypedArray } from './typeutil';

export type BufferValueType = WebGL2RenderingContext[
	| 'BYTE'
	| 'UNSIGNED_BYTE'
	| 'SHORT'
	| 'UNSIGNED_SHORT'
	| 'INT'
	| 'UNSIGNED_INT'
	| 'FLOAT'];

export type BufferTarget = WebGL2RenderingContext[
	| 'ARRAY_BUFFER'
	| 'ELEMENT_ARRAY_BUFFER'
	| 'COPY_READ_BUFFER'
	| 'COPY_WRITE_BUFFER'];
export type BufferUsage = WebGL2RenderingContext[
	| 'STATIC_DRAW'
	| 'DYNAMIC_DRAW'
	| 'STREAM_DRAW'
	| 'STATIC_COPY'
	| 'DYNAMIC_COPY'
	| 'STREAM_COPY'];

type ARRAY_TYPES = {
	[WebGL2RenderingContext.BYTE]: Int8Array;
	[WebGL2RenderingContext.UNSIGNED_BYTE]: Uint8Array | Uint8ClampedArray;
	[WebGL2RenderingContext.SHORT]: Int16Array;
	[WebGL2RenderingContext.UNSIGNED_SHORT]: Uint16Array;
	[WebGL2RenderingContext.INT]: Int32Array;
	[WebGL2RenderingContext.UNSIGNED_INT]: Uint32Array;
	[WebGL2RenderingContext.FLOAT]: Float32Array;
};

export class GpuBuffer<T extends BufferValueType = BufferValueType> {
	readonly buffer: WebGLBuffer;
	readonly type: T;

	constructor(
		gl: WebGL2RenderingContext,
		array: ARRAY_TYPES[T],
		target: BufferTarget = gl.ARRAY_BUFFER,
		usage: BufferUsage = gl.STATIC_DRAW,
	) {
		this.buffer = gl.createBuffer();
		this.type = inferGlTypeFromArray(array) as T;
		gl.bindBuffer(target, this.buffer);
		gl.bufferData(target, array, usage);
	}

	dispose(gl: WebGL2RenderingContext) {
		gl.deleteBuffer(this.buffer);
	}
}

export class VertexBuffer extends GpuBuffer {
	readonly stride: number;

	constructor(gl: WebGL2RenderingContext, array: TypedArray, stride: number) {
		super(gl, array);
		this.stride = stride;
	}
}

export class BufferSet<A extends string = string, V extends GpuBuffer = GpuBuffer> extends Map<
	A,
	V
> {
	dispose(gl: WebGL2RenderingContext) {
		for (const buffer of this.values()) {
			buffer.dispose(gl);
		}
	}
}

export function inferGlTypeFromArray(array: Int8Array): WebGL2RenderingContext['BYTE'];
export function inferGlTypeFromArray(array: Uint8Array): WebGL2RenderingContext['UNSIGNED_BYTE'];
export function inferGlTypeFromArray(
	array: Uint8ClampedArray,
): WebGL2RenderingContext['UNSIGNED_BYTE'];
export function inferGlTypeFromArray(array: Int16Array): WebGL2RenderingContext['SHORT'];
export function inferGlTypeFromArray(array: Uint16Array): WebGL2RenderingContext['UNSIGNED_SHORT'];
export function inferGlTypeFromArray(array: Int32Array): WebGL2RenderingContext['INT'];
export function inferGlTypeFromArray(array: Uint32Array): WebGL2RenderingContext['UNSIGNED_INT'];
export function inferGlTypeFromArray(array: Float32Array): WebGL2RenderingContext['FLOAT'];
export function inferGlTypeFromArray(array: TypedArray): BufferValueType;

export function inferGlTypeFromArray(array: TypedArray): BufferValueType {
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
