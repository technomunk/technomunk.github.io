import { randRange } from "./util"

export class Vec3 implements Iterable<number> {
    x: number
    y: number
    z: number

    static ONE = new Vec3(1, 1, 1)
    static ZERO = new Vec3(0, 0, 0)

    constructor(x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
    }

    *[Symbol.iterator](): IterableIterator<number> {
        yield this.x
        yield this.y
        yield this.z
    }

    static fromArr(arr: [number, number, number]): Vec3 {
        return vec3(arr[0], arr[1], arr[2])
    }

    static random(min: Vec3, max: Vec3): Vec3 {
        return vec3(randRange(min.x, max.x), randRange(min.y, max.y), randRange(min.z, max.z))
    }

    static dot(a: Vec3, b: Vec3): number {
        return a.x * b.x + a.y * b.y + a.z * b.z
    }

    static cross(a: Vec3, b: Vec3): Vec3 {
        return vec3(a.y*b.z - a.z*b.y, a.z*b.x - a.x*b.z, a.x*b.y - a.y*b.x)
    }

    copy(): Vec3 {
        return vec3(this.x, this.y, this.z)
    }

    compMul(v: number): Vec3 {
        return vec3(this.x * v, this.y * v, this.z * v)
    }

    neg(o: Vec3): Vec3 {
        return vec3(this.x - o.x, this.y - o.y, this.z - o.z)
    }

    norm2(): number {
        return this.x*this.x + this.y*this.y + this.z*this.z
    }

    norm(): number {
        return Math.sqrt(this.norm2())
    }

    normalized(): Vec3 {
        const n = this.norm()
        return vec3(this.x / n, this.y / n, this.z / n)
    }
}

export function vec3(x: number, y: number, z: number): Vec3 {
    return new Vec3(x, y, z)
}
