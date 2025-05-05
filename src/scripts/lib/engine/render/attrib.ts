export type AttributeDataType = WebGL2RenderingContext[
	| 'BYTE'
	| 'UNSIGNED_BYTE'
	| 'SHORT'
	| 'UNSIGNED_SHORT'
	| 'INT'
	| 'INT_2_10_10_10_REV'
	| 'UNSIGNED_INT'
	| 'UNSIGNED_INT_2_10_10_10_REV'
	| 'HALF_FLOAT'
	| 'FLOAT'];

export type TypedArray =
	| Int8Array
	| Uint8Array
	| Uint8ClampedArray
	| Int16Array
	| Uint16Array
	| Int32Array
	| Uint32Array
	| Float32Array;

export interface AttributeData<T extends TypedArray = TypedArray> {
	values: T;
	size: number;
}

export type AttributeDataSet = Record<string, AttributeData>;
