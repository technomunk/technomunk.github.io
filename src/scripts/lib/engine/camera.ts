import { mat4, vec3 } from "gl-matrix"
import type { Vec3 } from "./types"

export interface Camera {
    get position(): Vec3
    get right(): vec3
    calcView(result?: mat4): mat4
    calcProjection(widthToHeight: number, result?: mat4): mat4
}

export class PerspectiveCamera implements Camera {
    readonly position: Vec3
    readonly target: Vec3
    readonly verticalFov: number
    near: number
    far: number

    constructor(
        position: Vec3 = [0, 1, -2],
        target: Vec3 = [0, 0, 0],
        verticalFov: number = Math.PI / 2,
        near: number = .01,
        far: number = 10,
    ) {
        this.position = position
        this.target = target
        this.verticalFov = verticalFov
        this.near = near
        this.far = far
    }

    get right(): vec3 {
        const result = vec3.create()
        return vec3.normalize(result, vec3.cross(result, vec3.sub(result, this.target, this.position), [0, 1, 0]))
    }

    calcView(result?: mat4): mat4 {
        result = result || mat4.create()
        return mat4.lookAt(result, this.position, this.target, [0, 1, 0])
    }

    calcProjection(widthToHeight: number, result?: mat4): mat4 {
        result = result || mat4.create()
        return mat4.perspective(result, this.verticalFov, widthToHeight, this.near, this.far)
    }
}
