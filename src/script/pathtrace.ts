import { compileProgram } from "./lib/glutil"

import vertexShader from "bundle-text:/src/shader/fullscreen.vs"
import fragmentShader from "bundle-text:/src/shader/pathtrace.fs"
import { Vec3, vec3 } from "./lib/vec3";
import { Bounds, randRange } from "./lib/util"

const CONTEXT_OPTIONS: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    desynchronized: true,
    failIfMajorPerformanceCaveat: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,
    stencil: false,
}
const DATA_UBO_INDEX = 0
const MAX_BOUNCES = 8
const MAX_RAYS_PER_PIXEL = 1 << 10
const DEFAULT_RAYS_PER_PIXEL = 1 << 8
const DEFAULT_BOUNCES = 2

type UniformLocations = {
    uResolution: WebGLUniformLocation
    uCamFov: WebGLUniformLocation
    uLightColor: WebGLUniformLocation
    uLightDir: WebGLUniformLocation
    uSphereCount: WebGLUniformLocation
    uBounces: WebGLUniformLocation
    uRaysPerPixel: WebGLUniformLocation
}

interface MaterialBounds {
    albedo?: Bounds<vec3>,
    smoothness?: Bounds<number>,
    emissive?: Bounds<Vec3>,
}

class Material {
    albedo: Vec3
    smoothness: number
    emissive: Vec3

    constructor(albedo: Vec3 = Vec3.ONE, smoothness = 0.5, emissive: Vec3 = Vec3.ZERO) {
        this.albedo = albedo
        this.smoothness = smoothness
        this.emissive = emissive
    }

    static random(bounds: MaterialBounds = {}) {
        return new Material(
            Vec3.random(bounds.albedo?.[0] || Vec3.ZERO, bounds.albedo?.[1] || Vec3.ONE),
            randRange(bounds.smoothness?.[0] || 0, bounds.smoothness?.[1] || 1),
            Vec3.random(bounds.emissive?.[0] || Vec3.ZERO, bounds.emissive?.[1] || Vec3.ONE),
        )
    }
}

interface SphereBounds {
    pos?: Bounds<Vec3>
    radius?: Bounds<number>
    material?: MaterialBounds
}

class Sphere {
    pos: Vec3
    radius: number
    material: Material

    constructor(pos: Vec3, radius: number, material: Material = new Material()) {
        this.pos = pos
        this.radius = radius
        this.material = material
    }

    static random(bounds: SphereBounds = {}): Sphere {
        return new Sphere(
            Vec3.random(bounds.pos?.[0] || vec3(-1, -1, 1), bounds.pos?.[1] || vec3(1, 1, 3)),
            randRange(bounds.radius?.[0] || 0.1, bounds.radius?.[1] || 0.3),
            Material.random(bounds.material)
        )
    }

    data(): Array<number> {
        return [
            ...this.pos, this.radius,
            ...this.material.albedo, this.material.smoothness,
            ...this.material.emissive, 0,
        ]
    }
}

type Scene = {
    spheres: Sphere[]
}

class Renderer {
    canvas: HTMLCanvasElement
    gl: WebGL2RenderingContext
    program: WebGLProgram
    uniforms: UniformLocations
    dataBuffer: WebGLBuffer
    dataOffset = -1
    
    bounces = DEFAULT_BOUNCES
    raysPerPixel = DEFAULT_RAYS_PER_PIXEL

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.gl = canvas.getContext("webgl2", CONTEXT_OPTIONS)!
        const dbgRenderInfo = this.gl.getExtension("WEBGL_debug_renderer_info")
        if (dbgRenderInfo) {
            console.log(this.gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL))
            console.log(this.gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL))
        }
        console.log(this.gl.getParameter(this.gl.SHADING_LANGUAGE_VERSION))
        console.log(this.gl.getParameter(this.gl.VENDOR))
        console.log(this.gl.getParameter(this.gl.VERSION))
        this.program = compileProgram(this.gl, vertexShader, fragmentShader)
        this.uniforms = {
            uResolution: this.gl.getUniformLocation(this.program, "uResolution")!,
            uCamFov: this.gl.getUniformLocation(this.program, "uCamFov")!,
            uLightColor: this.gl.getUniformLocation(this.program, "uLightColor")!,
            uLightDir: this.gl.getUniformLocation(this.program, "uLightDir")!,
            uSphereCount: this.gl.getUniformLocation(this.program, "uSphereCount")!,
            uBounces: this.gl.getUniformLocation(this.program, "uBounces")!,
            uRaysPerPixel: this.gl.getUniformLocation(this.program, "uRaysPerPixel")!,
        }
        this.dataBuffer = this.gl.createBuffer()!;
        this.setupDataUniformBuffer()
        console.log(this)
    }

    resize(width: number, height: number) {
        this.canvas.width = width
        this.canvas.height = height
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight)
    }

    draw(scene: Scene) {
        this.gl.useProgram(this.program)
        const w = this.gl.drawingBufferWidth
        const h = this.gl.drawingBufferHeight

        this.updateDataBuffer(scene.spheres)
        this.bounces = DEFAULT_BOUNCES
        this.raysPerPixel = DEFAULT_RAYS_PER_PIXEL

        this.gl.uniform2f(this.uniforms["uResolution"], w, h)
        this.gl.uniform1f(this.uniforms["uCamFov"], 90 * Math.PI / 180)
        this.gl.uniform3f(this.uniforms["uLightColor"], 0.3, 0.3, 0.3)
        this.gl.uniform3fv(this.uniforms["uLightDir"], vec3(2.5, -2, -1).normalized())
        this.redraw()
    }

    redraw() {
        this.gl.uniform1i(this.uniforms["uBounces"], this.bounces)
        this.gl.uniform1i(this.uniforms["uRaysPerPixel"], this.raysPerPixel)
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 3)
        console.log({bounces: this.bounces, rpp: this.raysPerPixel})

        if ((this.raysPerPixel << 1) <= MAX_RAYS_PER_PIXEL) {
            this.raysPerPixel <<= 1
        } else if (this.bounces + 1 <= MAX_BOUNCES) {
            this.bounces += 1
        } else {
            this.raysPerPixel = 1
            this.bounces = 1
        }
    }

    private setupDataUniformBuffer() {
        const blockIndex = this.gl.getUniformBlockIndex(this.program, "Data")
        const blockSize = this.gl.getActiveUniformBlockParameter(this.program, blockIndex, this.gl.UNIFORM_BLOCK_DATA_SIZE)
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.dataBuffer)
        this.gl.bufferData(this.gl.UNIFORM_BUFFER, blockSize, this.gl.DYNAMIC_DRAW)
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null)
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, DATA_UBO_INDEX, this.dataBuffer)
        this.gl.uniformBlockBinding(this.program, blockIndex, DATA_UBO_INDEX)

        const dataIndices = this.gl.getUniformIndices(this.program, ["uData"])!
        this.dataOffset = this.gl.getActiveUniforms(this.program, dataIndices, this.gl.UNIFORM_OFFSET)[0]
    }

    private updateDataBuffer(spheres: Sphere[]) {
        const data = new Float32Array(spheres.length * 12)
        let offset = 0;
        for (const sphere of spheres) {
            data.set(sphere.data(), offset)
            offset += 12
        }

        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.dataBuffer)
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, this.dataOffset, data)
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null)
        this.gl.uniform1i(this.uniforms["uSphereCount"], spheres.length)
    }
}

function randomScene(): Scene {
    const r = window.innerWidth / window.innerHeight;
    let w, h;
    if (r > 1) {
        w = r * 0.6;
        h = 0.6;
    } else {
        w = 0.6;
        h = 0.6 / r;
    }
    const scene: Scene = { spheres: [] }
    for (let i = 0; i < 32; ++i) {
        scene.spheres.push(
            Sphere.random({
                pos: [vec3(-w, -h, 1), vec3(w, h, 4)],
                material: {
                    smoothness: [0.5, 1],
                    emissive: [Vec3.ZERO, vec3(0.8, 0.8, 0.8)],
                }
            }))
    }
    return scene
}

const TEST_SCENE: Scene = {
    spheres: [
        new Sphere(vec3(0.25, 0.25, 1), 0.25, new Material(vec3(1, 0.4, 0.4), 0)),
        new Sphere(vec3(-0.25, 0.0, 4), 1, new Material(vec3(0.4, 1, 0.4), 0.4)),
        new Sphere(vec3(0.0, -0.5, 2), 0.5, new Material(vec3(0.4, 0.4, 1), 0.8)),
        new Sphere(vec3(0, -80, 80), 100),
        new Sphere(vec3(-4, 4, 4), 4, new Material(Vec3.ZERO, 0.1, Vec3.ONE)),
    ]
}

function main() {
    const view = new Renderer(document.getElementById("main-canvas") as HTMLCanvasElement)
    const scene = randomScene()
    window.addEventListener('resize', () => { view.resize(window.innerWidth, window.innerHeight); view.draw(scene) })
    view.resize(window.innerWidth, window.innerHeight)
    window.addEventListener("keyup", (e) => {
        if (e.key == " " || e.code == "Space") {
            requestAnimationFrame(() => view.redraw())
        }
    })
    // setTimeout(() => requestAnimationFrame(() => view.draw(scene)), 2000)
    requestAnimationFrame(() => view.draw(scene))
}

function isMobile(): boolean {
    const POSSIBLE_MATCHES = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];
    return POSSIBLE_MATCHES.some((m) => navigator.userAgent.match(m))
}

window.onload = main
