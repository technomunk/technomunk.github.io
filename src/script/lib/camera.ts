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
        this.rotateY(y)
        this.rotateX(x)
    }

    rotateX(x: number): void {
        const axis = Vec3.cross(this.pos, Vec3.Y).normalize()
        this.pos = this.pos.rotate(axis, x)
        this.dir = Vec3.ZERO.sub(this.pos).normalize()
    }
    rotateY(y: number): void {
        this.pos = this.pos.rotate(Vec3.Y, y)
        this.dir = Vec3.ZERO.sub(this.pos).normalize()
    }
}
