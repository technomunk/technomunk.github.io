import Mesh from "./mesh"
import type { MeshStyle } from "./mesh"

/** The concept of a basic shape. */
export abstract class Shape {
    abstract composePositions(): ArrayLike<number>
    abstract composeTriangleIndices(): ArrayLike<number>
    abstract composeLineIndices(): ArrayLike<number>

    constructMesh(style: MeshStyle): Mesh {
        switch (style) {
            case "line":
                return new Mesh(this.composePositions(), this.composeLineIndices(), "line")
            case "triangle":
                return new Mesh(this.composePositions(), this.composeTriangleIndices(), "triangle")
            default:
                throw "Not implemented"
        }
    }
}

export class Cube extends Shape {
    size: number

    constructor(size: number) {
        super()
        this.size = size
    }

    composePositions(): Array<number> {
        return [
            -this.size, -this.size, -this.size,  // 0
            -this.size, -this.size, +this.size,  // 1
            -this.size, +this.size, -this.size,  // 2
            -this.size, +this.size, +this.size,  // 3
            +this.size, -this.size, -this.size,  // 4
            +this.size, -this.size, +this.size,  // 5
            +this.size, +this.size, -this.size,  // 6
            +this.size, +this.size, +this.size,  // 7
        ]
    }

    composeLineIndices(): Array<number> {
        return [
            0, 1, 0, 2, 0, 4,
            1, 3, 1, 5,
            2, 3, 2, 6,
            3, 7,
            4, 5, 4, 6,
            5, 7,
            6, 7,
        ]
    }

    composeTriangleIndices(): Array<number> {
        return [
            0, 2, 1, 1, 2, 3,  // x-
            4, 7, 6, 4, 5, 7,  // x+
            0, 1, 4, 1, 5, 4,  // y-
            2, 7, 3, 2, 6, 7,  // y+
            0, 6, 2, 0, 4, 6,  // z-
            1, 3, 7, 3, 7, 5,  // z+
        ]
    }
}

export class IcoSphere extends Shape {
    radius: number
    constructor(radius: number) {
        super()
        this.radius = radius
    }

    composePositions(): Array<number> {
        const t = (1 + Math.sqrt(5)) / 2 * this.radius
        const r = this.radius

        return [
            -r, +t, +0,  // 0
            +r, +t, +0,  // 1
            -r, -t, +0,  // 2
            +r, -t, +0,  // 3
            +0, -r, +t,  // 4
            +0, +r, +t,  // 5
            +0, -r, -t,  // 6
            +0, +r, -t,  // 7
            +t, +0, -r,  // 8
            +t, +0, +r,  // 9
            -t, +0, -r,  // 10
            -t, +0, +r,  // 11
        ]
    }

    composeLineIndices(): Array<number> {
        return [
            0, 1, 0, 5, 0, 7, 0, 10, 0, 11,
            1, 5, 1, 7, 1, 8, 1, 9,
            2, 3, 2, 4, 2, 6, 2, 10, 2, 11,
            3, 4, 3, 6, 3, 8, 3, 9,
            4, 5, 4, 9, 4, 11,
            5, 9, 5, 11,
            6, 7, 6, 8, 6, 10,
            7, 8, 7, 10,
            8, 9,
            10, 11,
        ]
    }

    composeTriangleIndices(): Array<number> {
        throw "Not implemented"
    }
}
