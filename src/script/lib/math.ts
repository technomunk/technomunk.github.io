/// Linear algebra implementations

import { randRange } from "./util"

export class Vec3 extends Float32Array {
    constructor(x: number, y: number, z: number) {
        super([x, y, z])
    }

    static random(min: Vec3, max: Vec3): Vec3 {
        return new Vec3(randRange(min[0], max[0]), randRange(min[1], max[1]), randRange(min[2], max[2]))
    }

    static readonly ZERO = new Vec3(0, 0, 0)
    static readonly X = new Vec3(1, 0, 0)
    static readonly Y = new Vec3(0, 1, 0)
    static readonly Z = new Vec3(0, 0, 1)
    static readonly ONE = new Vec3(1, 1, 1)

    copy(): Vec3 {
        return new Vec3(this[0], this[1], this[2])
    }

    get x(): number { return this[0] }
    set x(v: number) { this[0] = v }
    get y(): number { return this[1] }
    set y(v: number) { this[1] = v }
    get z(): number { return this[2] }
    set z(v: number) { this[2] = v }

    add(o: Vec3): Vec3 { return this.copy().addi(o) }
    addi(o: Vec3): Vec3 {
        this[0] += o[0]
        this[1] += o[1]
        this[2] += o[2]
        return this
    }
    sub(o: Vec3): Vec3 { return this.copy().subi(o) }
    subi(o: Vec3): Vec3 {
        this[0] -= o[0]
        this[1] -= o[1]
        this[2] -= o[2]
        return this
    }
    mul(o: Vec3 | number): Vec3 { return this.copy().muli(o) }
    muli(o: Vec3 | number): Vec3 {
        if (o instanceof Vec3) {
            this[0] *= o[0]
            this[1] *= o[1]
            this[2] *= o[2]
        } else {
            this[0] *= o
            this[1] *= o
            this[2] *= o
        }
        return this
    }
    div(o: Vec3 | number): Vec3 { return this.copy().divi(o) }
    divi(o: Vec3 | number): Vec3 {
        if (o instanceof Vec3) {
            this[0] /= o[0]
            this[1] /= o[1]
            this[2] /= o[2]
        } else {
            this[0] /= o
            this[1] /= o
            this[2] /= o
        }
        return this
    }

    /** Get the mathematical size of the vector */
    norm(): number {
        return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2])
    }
    normalized(): Vec3 { return this.copy().normalize() }
    /** Resize the vector such that it becomes unit length */
    normalize(): Vec3 {
        const n = this.norm()
        this[0] /= n
        this[1] /= n
        this[2] /= n
        return this
    }

    static dot(a: Vec3, b: Vec3): number {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
    }

    static cross(a: Vec3, b: Vec3): Vec3 {
        return new Vec3(
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
        )
    }

    rotate(axis: Vec3, angle: number): Vec3 {
        // https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula
        const cosAngle = Math.cos(angle)
        return Vec3
            .cross(axis, this)
            .mul(Math.sin(angle))
            .addi(this.mul(cosAngle))
            .addi(axis.mul(Vec3.dot(axis, this) * (1 - cosAngle)))
    }
}

export class Mat3 extends Float32Array {
    constructor(
        x0y0: number, x1y0: number, x2y0: number,
        x0y1: number, x1y1: number, x2y1: number,
        x0y2: number, x1y2: number, x2y2: number,
    ) {
        super([
            x0y0, x1y0, x2y0,
            x0y1, x1y1, x2y1,
            x0y2, x1y2, x2y2,
        ])
    }

    transform(v: Vec3): Vec3 {
        return new Vec3(
            v[0] * this[0] + v[0] * this[1] + v[0] * this[2],
            v[1] * this[3] + v[1] * this[4] + v[1] * this[5],
            v[2] * this[6] + v[2] * this[7] + v[2] * this[8],
        )
    }

    /** Construct a rotation matrix that translates Z+ to look in provided direction
     * @param dir normalized new Z+ direction
     * @param up normalized "up" reference
     * @returns rotational matrix
     */
    static lookIn(dir: Vec3, up = Vec3.Y): Mat3 {
        const x = Vec3.cross(up, dir).normalized()
        const y = Vec3.cross(dir, x)
        return new Mat3(
            x[0], x[1], x[2],
            y[0], y[1], y[2],
            dir[0], dir[1], dir[2],
        )
    }
}

export class Mat4 extends Float32Array {
    constructor(
        x0y0: number, x1y0: number, x2y0: number, x3y0: number,
        x0y1: number, x1y1: number, x2y1: number, x3y1: number,
        x0y2: number, x1y2: number, x2y2: number, x3y2: number,
        x0y3: number, x1y3: number, x2y3: number, x3y3: number,
    ) {
        super([
            x0y0, x1y0, x2y0, x3y0,
            x0y1, x1y1, x2y1, x3y1,
            x0y2, x1y2, x2y2, x3y2,
            x0y3, x1y3, x2y3, x3y3,
        ])
    }

    /** Transform provided vector applying translation
     * @param p 
     * @returns new point
     */
    transformPoint(p: Vec3): Vec3 {
        return this.transform(p, true)
    }
    /** Transform provided vector without any translation
     * @param p 
     * @returns new vector
     */
    transformVector(v: Vec3): Vec3 {
        return this.transform(v, false)
    }

    transform(v: Vec3, translate: boolean): Vec3 {
        let d = 1, w = 0
        if (translate) {
            d /= (this[12] * v[0] + this[13] * v[1] + this[14] * v[2] + this[15])
            w = 1
        }
        return new Vec3(
            (this[0] * v[0] + this[1] * v[1] + this[2] * v[2] + this[3] * w) * d,
            (this[4] * v[0] + this[5] * v[1] + this[6] * v[2] + this[7] * w) * d,
            (this[8] * v[0] + this[9] * v[1] + this[10] * v[2] + this[11] * w) * d,
        )
    }
}
