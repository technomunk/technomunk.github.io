import type { Vec3 } from "./types";

/** A space-optimized vertex storage solution */
export class VertexStore {
    readonly buffer: Array<number> = []

    push(point: Vec3) {
        this.buffer.push(...point)
    }

    get(index: number): Vec3 {
        return this.buffer.slice(index * 3, index * 3 + 3) as Vec3
    }
    set(index: number, value: Vec3) {
        this.buffer.splice(index * 3, 3, ...value)
    }
}
