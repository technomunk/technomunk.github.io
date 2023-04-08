import { Vec3 } from "./math"

export class Camera {
    pos: Vec3
    dir: Vec3
    fov: number

    constructor(pos = new Vec3(0, 0, -4), dir = Vec3.Z, fov = 45 * Math.PI / 180) {
        this.pos = pos
        this.dir = dir
        this.fov = fov
    }

    rotate(x: number, y: number): void {
        this.rotateX(x)
        this.rotateY(y)
    }

    rotateX(x: number): void {
        const d = this.pos.copy()
        this.pos.y = d.y * Math.cos(x) + d.z * Math.sin(x)
        this.pos.z = d.z * Math.cos(x) - d.y * Math.sin(x)
        this.dir = Vec3.ZERO.sub(this.pos).normalize()
    }
    rotateY(y: number): void {
        const d = this.pos.copy()
        this.pos.z = d.z * Math.cos(y) + d.x * Math.sin(y)
        this.pos.x = d.x * Math.cos(y) - d.z * Math.sin(y)
        this.dir = Vec3.ZERO.sub(this.pos).normalize()
    }
}
