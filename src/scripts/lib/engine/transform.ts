import { mat4 } from "gl-matrix"
import type { Vec3 } from "./types"

export default class Transform {
    readonly pos: Vec3

    constructor(pos: Vec3 = [0, 0, 0]) {
        this.pos = pos
    }

    calcTransform(result?: mat4): mat4 {
        result = result || mat4.create()
        return mat4.fromTranslation(result, this.pos)
    }
}
