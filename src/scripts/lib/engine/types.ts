export type Vec3 = [number, number, number]
export interface Mesh {
    get positions(): Float32Array
    get indices(): Uint16Array
}
