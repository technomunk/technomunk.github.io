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

export const keys = <T extends object>(obj: T): (keyof T)[] => Object.keys(obj) as (keyof T)[];
export const values = <T extends object>(obj: T): T[keyof T][] =>
	Object.values(obj) as T[keyof T][];
export const entries = <T extends object>(obj: T): [keyof T, T[keyof T]][] =>
	Object.entries(obj) as [keyof T, T[keyof T]][];
