import { shuffle } from "@lib/util";
import type { Component, System, Vec3 } from "./types";
import Mesh from "./mesh";
import type Entity from "./entity";

class Particle {
    mass: number
    pinned: boolean
    colliding: boolean

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

export class Cloth implements Component {
    readonly particles: Array<Particle>
    readonly connections: Array<Connection>

    readonly mesh: Mesh

    constructor(
        offset: Vec3 = [0, 0, 0],
        particlesPerSide: number = 10,
        density: number = 1,
    ) {
        [this.particles, this.connections] = Cloth._allocateParticlesAndConnections(offset, particlesPerSide, density)
        this.mesh = new Mesh(
            this.particles.length * 3,
            this.connections.length * 2,
            "line",
        )
        this._setIndices()
        this.updatePositionsBuffer()
    }

    protected static _allocateParticlesAndConnections(
        offset: Vec3,
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
                // const pin = (b + 1 == particlesPerSide)
                particles.push(new Particle(x + offset[0], offset[1], z + offset[2], massPerParticle))
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
        shuffle(connections)
        return [particles, connections]
    }

    updatePositionsBuffer() {
        for (let i = 0; i < this.particles.length; ++i) {
            this.mesh.positions[i * 3 + 0] = this.particles[i].curX
            this.mesh.positions[i * 3 + 1] = this.particles[i].curY
            this.mesh.positions[i * 3 + 2] = this.particles[i].curZ
        }
        this.mesh.isDirty = true
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

    protected _setIndices() {
        for (let i = 0; i < this.connections.length; ++i) {
            this.mesh.indices[i * 2 + 0] = this.connections[i].a
            this.mesh.indices[i * 2 + 1] = this.connections[i].b
        }
    }
}

export class SphereCollider implements Component {
    radius: number
    constructor(radius: number) {
        this.radius = radius
    }
}

class InternalCollider {
    static NUDGE_FACTOR = 1e-5
    readonly radius: number
    readonly pos: Vec3

    constructor(pos: Vec3, radius: number) {
        this.pos = pos
        this.radius = radius
    }

    includes(x: number, y: number, z: number) {
        const dx = x - this.pos[0]
        const dy = y - this.pos[1]
        const dz = z - this.pos[2]
        return dx*dx + dy*dy + dz*dz < this.radius * this.radius + InternalCollider.NUDGE_FACTOR
    }

    pushOut(x: number, y: number, z: number): Vec3 {
        const dx = x - this.pos[0]
        const dy = y - this.pos[1]
        const dz = z - this.pos[2]

        const len = Math.sqrt(dx*dx + dy*dy + dz*dz)
        const multiplier = this.radius / len

        return [this.pos[0] + dx * multiplier, this.pos[1] + dy * multiplier, this.pos[2] + dz * multiplier]
    }
}

export class ClothSimSystem implements System {
    readonly cloths: Array<Cloth> = []
    readonly colliders: Array<InternalCollider> = []
    gravity: Vec3 = [0, -1, 0]
    maxDt = .05
    // timestep = .01
    // maxTimestepsPerFrame = 5

    constructor() {}

    onEntityAdded(entity: Entity): void {
        for (const component of entity.components) {
            if (component instanceof Cloth) {
                this.cloths.push(component)
            }
            if (component instanceof SphereCollider) {
                this.colliders.push(new InternalCollider(entity.pos, component.radius))
            }
        }
    }

    run(dt: number) {
        if (dt > this.maxDt) {
            dt = this.maxDt
        }
        for (const cloth of this.cloths) {
            this.simulateCloth(cloth, dt)
        }
        // const steps = Math.min(Math.ceil(dt / this.timestep), this.maxTimestepsPerFrame)
        // for (let i = 0; i < steps; ++i) {
        // }
    }

    simulateCloth(cloth: Cloth, dt: number) {
        this._integrateParticlePositions(cloth, dt)
        this._resolveCollisions(cloth)
        this._solveConnectionConstraints(cloth)
        cloth.updatePositionsBuffer()
    }

    protected _integrateParticlePositions(cloth: Cloth, dt: number) {
        const dt2 = dt * dt
        const [fx, fy, fz] = this.gravity
        for (const p of cloth.particles) {
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

    protected _resolveCollisions(cloth: Cloth) {
        for (const p of cloth.particles) {
            if (p.pinned) {
                continue
            }

            for (const c of this.colliders) {
                if (c.includes(p.curX, p.curY, p.curZ)) {
                    p.colliding = true
                    const [x, y, z] = c.pushOut(p.curX, p.curY, p.curZ)
                    p.curX = x
                    p.curY = y
                    p.curZ = z
                } else {
                    p.colliding = false
                }
            }
        }
    }

    protected _solveConnectionConstraints(cloth: Cloth) {
        for (const c of cloth.connections) {
            const pa = cloth.particles[c.a]
            const pb = cloth.particles[c.b]
            const dx = pa.curX - pb.curX
            const dy = pa.curY - pb.curY
            const dz = pa.curZ - pb.curZ

            const dlen = Math.sqrt((dx * dx + dy * dy + dz * dz))
            const dFactor = (c.length - dlen) / dlen * .5
            const ox = dx * dFactor
            const oy = dy * dFactor
            const oz = dz * dFactor

            if (!pa.pinned && !pa.colliding) {
                pa.curX += ox
                pa.curY += oy
                pa.curZ += oz
            }
            if (!pb.pinned && ! pb.colliding) {
                pb.curX -= ox
                pb.curY -= oy
                pb.curZ -= oz
            }
        }
    }
}
