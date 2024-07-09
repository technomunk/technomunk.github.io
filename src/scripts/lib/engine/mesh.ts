export type MeshStyle = "line" | "triangle"

/** A collection of vertices and triangles or lines for drawing on GPU. */
export default class Mesh {
    readonly positions: Float32Array
    readonly indices: Uint16Array
    readonly style: MeshStyle

    isDirty = true

    constructor(positions: ArrayLike<number> | number, indices: ArrayLike<number> | number, style: MeshStyle) {
        this.positions = new Float32Array(positions as ArrayLike<number>)
        this.indices = new Uint16Array(indices as ArrayLike<number>)
        this.style = style
    }

    updatePositions(positions: Iterable<number>) {
        let i = 0;
        for (const pos of positions) {
            this.positions[i++] = pos
        }
        this.isDirty = true
    }
}
