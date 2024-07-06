import Transform from "./transform"
import type { Mesh, Vec3 } from "./types"

/** An object in the scene */
export default class Entity extends Transform {
    readonly mesh?: Mesh

    constructor(pos: Vec3 = [0, 0, 0], mesh?: Mesh) {
        super(pos)
        this.mesh = mesh
    }
}
