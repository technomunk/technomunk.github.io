import type { Mesh } from "./types"

export class Cube implements Mesh {
    readonly positions: Float32Array
    readonly indices: Uint16Array

    constructor(size: number) {
        this.positions = new Float32Array([
            -size, -size, -size,  // 0
            -size, -size, +size,  // 1
            -size, +size, -size,  // 2
            -size, +size, +size,  // 3
            +size, -size, -size,  // 4
            +size, -size, +size,  // 5
            +size, +size, -size,  // 6
            +size, +size, +size,  // 7
        ])
        this.indices = new Uint16Array([
            // 0, 2, 1, 1, 2, 3,  // x-
            // 4, 7, 6, 4, 5, 7,  // x+
            // 0, 1, 4, 1, 5, 4,  // y-
            // 2, 7, 3, 2, 6, 7,  // y+
            // 0, 6, 2, 0, 4, 6,  // z-
            // 1, 3, 7, 3, 7, 5,  // z+
            0, 1, 0, 2, 0, 4,
            1, 3, 1, 5,
            2, 3, 2, 6,
            3, 7,
            4, 5, 4, 6,
            5, 7,
            6, 7,
        ])
    }
}
