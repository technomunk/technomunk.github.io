export type Vec3 = [number, number, number]
export type DrawStyle = "line" | "triangle"
export type PositionBuffer = Float32Array
export type IndexBuffer = Uint16Array
export interface Mesh {
    get style(): DrawStyle
    get positions(): PositionBuffer
    get indices(): IndexBuffer

    isDirty: boolean
}
