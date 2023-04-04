import { Vec3, vec3 } from "./vec3"

export class Camera {
    pos: Vec3
    target: Vec3
    fov: number

    constructor(pos = vec3(0, 0, -4), target = Vec3.ZERO, fov = 45 * Math.PI / 180) {
        this.pos = pos
        this.target = target
        this.fov = fov
    }

    rotate(x: number, y: number): void {
        this.rotateX(x)
        this.rotateY(y)
    }

    rotateX(x: number): void {
        const d = this.pos.neg(this.target)
        this.pos.y = d.y * Math.cos(x) + d.z * Math.sin(x) + this.target.y
        this.pos.z = this.target.z - d.y * Math.sin(x) + d.z * Math.cos(x)
    }
    rotateY(y: number): void {
        const d = this.pos.neg(this.target)
        this.pos.z = d.z * Math.cos(y) + d.x * Math.sin(y) + this.target.z
        this.pos.x = this.target.x - d.z * Math.sin(y) + d.x * Math.cos(y)
    }
}
