import type Scene from "./scene";
import type { DrawStyle, IndexBuffer, Mesh, Vec3, PositionBuffer } from "./types";

class Particle {
    mass: number
    pinned: boolean

    curX: number
    curY: number
    curZ: number

    protected _oldX: number
    protected _oldY: number
    protected _oldZ: number


    constructor(x: number, y: number, z: number, mass: number, pinned = false) {
        this.curX = x
        this._oldX = x
        this.curY = y
        this._oldY = y
        this.curZ = z
        this._oldZ = z
        this.mass = mass
        this.pinned = pinned
    }

    get oldX(): number {
        return this._oldX
    }
    get oldY(): number {
        return this._oldY
    }
    get oldZ(): number {
        return this._oldZ
    }

    updatePos(x: number, y: number, z: number) {
        this._oldX = this.curX
        this.curX = x
        this._oldY = this.curY
        this.curY = y
        this._oldZ = this.curZ
        this.curZ = z
    }

    static dist2(a: Particle, b: Particle): number {
        const dx = a.curX - b.curX
        const dy = a.curY - b.curY
        const dz = a.curZ - b.curZ
        return dx * dx + dy * dy + dz * dz
    }
}
interface Connection {
    a: number,
    b: number,
    length: number,
}

export class Cloth implements Mesh {
    readonly particles: Array<Particle>
    readonly connections: Array<Connection>

    readonly style: DrawStyle = "line"
    readonly positions: PositionBuffer
    readonly indices: IndexBuffer
    isDirty = true

    constructor(particlesPerSide: number = 10, density: number = 1) {
        [this.particles, this.connections] = Cloth._allocateParticlesAndConnections(particlesPerSide, density)
        this.positions = Cloth._allocateVertexBuffer(this.particles)
        this.updatePositionsBuffer()
        this.indices = Cloth._allocateIndexBuffer(this.connections)
    }

    protected static _allocateParticlesAndConnections(
        particlesPerSide: number,
        massPerParticle: number
    ): [Array<Particle>, Array<Connection>] {
        const particles: Array<Particle> = []
        const connections: Array<Connection> = []
        for (let a = 0; a < particlesPerSide; ++a) {
            for (let b = 0; b < particlesPerSide; ++b) {
                const index = particles.length
                const x = -1 + (a / (particlesPerSide - 1)) * 2
                const z = -2 + (b / (particlesPerSide - 1)) * 2
                const pin = (b + 1 == particlesPerSide)
                particles.push(new Particle(x, 1, z, massPerParticle, pin))
                if (a > 0) {
                    connections.push({ a: index, b: index - particlesPerSide, length: 0 })
                }
                if (b > 0) {
                    connections.push({ a: index, b: index - 1, length: 0 })
                }
            }
        }
        for (const c of connections) {
            c.length = Math.sqrt(Particle.dist2(particles[c.a], particles[c.b]))
        }
        return [particles, connections]
    }

    updatePositionsBuffer() {
        for (let i = 0; i < this.particles.length; ++i) {
            this.positions[i * 3 + 0] = this.particles[i].curX
            this.positions[i * 3 + 1] = this.particles[i].curY
            this.positions[i * 3 + 2] = this.particles[i].curZ
        }
        this.isDirty = true
    }
    protected static _allocateVertexBuffer(particles: Array<Particle>): Float32Array {
        return new Float32Array(particles.length * 3)
    }

    protected static _allocateIndexBuffer(connections: Array<Connection>): Uint16Array {
        const result = new Uint16Array(connections.length * 2)
        for (let i = 0; i < connections.length; ++i) {
            result[i * 2 + 0] = connections[i].a
            result[i * 2 + 1] = connections[i].b
        }
        return result
    }
}

export class ClothSimulator {
    readonly cloth: Cloth
    gravity: Vec3 = [0, -1, 0]

    constructor(cloth: Cloth) {
        this.cloth = cloth
    }

    simulate(scene: Scene, dt: number) {
        this._integrateParticlePositions(dt)
        this._solveConnectionConstraints()
        this.cloth.updatePositionsBuffer()
    }

    protected _integrateParticlePositions(dt: number) {
        const dt2 = dt * dt
        const [fx, fy, fz] = this.gravity
        for (const p of this.cloth.particles) {
            if (p.pinned) {
                continue
            }

            const ax = fx / p.mass
            const ay = fy / p.mass
            const az = fz / p.mass

            const nx = 2 * p.curX - p.oldX + ax * dt2
            const ny = 2 * p.curY - p.oldY + ay * dt2
            const nz = 2 * p.curZ - p.oldZ + az * dt2

            p.updatePos(nx, ny, nz)
        }
    }

    protected _solveConnectionConstraints() {
        for (const c of this.cloth.connections) {
            const pa = this.cloth.particles[c.a]
            const pb = this.cloth.particles[c.b]
            const dx = pa.curX - pb.curX
            const dy = pa.curY - pb.curY
            const dz = pa.curZ - pb.curZ

            const dlen = Math.sqrt((dx * dx + dy * dy + dz * dz))
            const dFactor = (c.length - dlen) / dlen * .5
            const ox = dx * dFactor
            const oy = dy * dFactor
            const oz = dz * dFactor

            if (!pa.pinned) {
                pa.curX += ox
                pa.curY += oy
                pa.curZ += oz
            }
            if (!pb.pinned) {
                pb.curX -= ox
                pb.curY -= oy
                pb.curZ -= oz
            }
        }
    }
}
