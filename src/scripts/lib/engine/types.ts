export type Vec3 = [number, number, number]
export type DrawStyle = "line" | "triangle"
export interface Mesh {
    get style(): DrawStyle
    get positions(): Float32Array
    get indices(): Uint16Array
}
