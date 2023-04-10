import { UniformSetters, compileProgram, composeUniformSetters, logDebugInfo, setUniforms } from "./lib/glutil"
import vertexShader from "/src/shader/pathtrace.vs"
import fragmentShader from "/src/shader/pathtrace.fs"
import { Bounds, clamp, error, isMobile, randRange } from "./lib/util"
import { Camera } from "./lib/camera";
import { GestureDecoder } from "./lib/gesture";
import { Mat3, Vec3 } from "./lib/math";

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
const DEFAULT_BOUNCES = 4
const SCROLL_SENSITIVITY = 4e-4

interface MaterialBounds {
    albedo?: Bounds<Vec3>,
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
            Math.sin(randRange(bounds.smoothness?.[0] || 0, bounds.smoothness?.[1] || 1)),
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
            Vec3.random(bounds.pos?.[0] || Vec3.ONE.mul(-1), bounds.pos?.[1] || Vec3.ONE),
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

interface Light {
    dir: Vec3
    color: Vec3
}

class Scene {
    camera: Camera
    spheres: Sphere[]
    light: Light
    ambient: Vec3

    constructor(camera = new Camera(), spheres: Sphere[] = [], light: Light = { dir: Vec3.ZERO, color: Vec3.ZERO }, ambient = Vec3.ZERO) {
        this.camera = camera
        this.spheres = spheres
        this.light = light
        this.ambient = ambient
    }

    static random(): Scene {
        const r = window.innerWidth / window.innerHeight;
        let w, h;
        if (r > 1) {
            w = r * 0.6;
            h = 0.6;
        } else {
            w = 0.6;
            h = 0.6 / r;
        }
        const scene = new Scene()
        for (let i = 0; i < 32; ++i) {
            scene.spheres.push(
                Sphere.random({
                    pos: [new Vec3(-w, -h, -1), new Vec3(w, h, 1)],
                    material: {
                        smoothness: [0.5, 1],
                        albedo: [Vec3.ONE.mul(0.1), Vec3.ONE],
                        emissive: [Vec3.ZERO, Vec3.ZERO],
                    }
                }))
            scene.spheres[i].material.emissive = scene.spheres[i].material.albedo.mul(Math.random())
        }

        scene.light.dir = Vec3.random(Vec3.ONE.mul(-1), new Vec3(1, 0, 1)).normalized()
        const brightness = randRange(1, 2)
        scene.light.color = new Vec3(brightness, brightness, brightness)
        scene.ambient = Vec3.random(Vec3.ONE.mul(0.1), Vec3.ONE.mul(0.4))

        return scene
    }
}

class Renderer {
    bounces = DEFAULT_BOUNCES
    readonly canvas: HTMLCanvasElement

    protected scaling
    protected gl: WebGL2RenderingContext
    protected program: WebGLProgram
    protected uniformSetters: UniformSetters
    protected dataBuffer: WebGLBuffer
    protected dataOffset = -1
    protected targetTextures: [WebGLTexture, WebGLTexture]
    protected framebuffer: WebGLFramebuffer
    protected frameIndex = 0
    protected animationRequest = -1
    protected resolution: [number, number]

    constructor(canvas: HTMLCanvasElement, renderScale = 1) {
        this.canvas = canvas
        this.scaling = renderScale
        this.gl = canvas.getContext("webgl2", CONTEXT_OPTIONS) ?? error("Could not get WebGL2 context")

        this.resolution = [this.gl.drawingBufferWidth * this.scaling, this.gl.drawingBufferHeight * this.scaling]
        logDebugInfo(this.gl)

        this.program = compileProgram(this.gl, vertexShader, fragmentShader)
        this.gl.useProgram(this.program)
        this.uniformSetters = composeUniformSetters(this.gl, this.program)
        this.dataBuffer = this.gl.createBuffer() ?? error("Could not allocate data buffer");
        this.setupDataUniformBuffer()

        this.framebuffer = this.gl.createFramebuffer() ?? error("Could not allocate framebuffer")
        this.targetTextures = [this.createTargetTexture(), this.createTargetTexture()]
    }

    get renderScale(): number {
        return this.scaling
    }
    set renderScale(v: number) {
        this.scaling = v
        this.resize(this.canvas.width, this.canvas.height)
    }

    resize(width: number, height: number) {
        this.canvas.width = width
        this.canvas.height = height
        this.resolution = [width * this.scaling, height * this.scaling]
        this.gl.deleteTexture(this.targetTextures[0])
        this.gl.deleteTexture(this.targetTextures[1])
        this.targetTextures = [this.createTargetTexture(), this.createTargetTexture()]
        this.gl.viewport(0, 0, ...this.resolution)
        this.frameIndex = 0
        this.redraw()
    }

    draw(scene: Scene) {
        this.frameIndex = 0
        this.gl.useProgram(this.program)
        this.updateDataBuffer(scene.spheres)

        setUniforms(this.uniformSetters, {
            uLightColor: scene.light.color,
            uLightDir: scene.light.dir,
            uAmbientColor: scene.ambient,
            uCamPos: scene.camera.pos,
            uView: Mat3.lookIn(scene.camera.dir),
            uCamFov: scene.camera.fov,
        })

        this.redraw()
    }

    protected redraw() {
        cancelAnimationFrame(this.animationRequest)

        setUniforms(this.uniformSetters, {
            uResolution: this.resolution,
            uBounces: this.bounces,
            uFrameIndex: this.frameIndex,
            uLastFrame: this.targetTextures[this.frameIndex % 2],
        })

        this.setupFramebuffer()
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

        this.frameIndex += 1
        this.present()

        if (this.frameIndex < 1<<9) {
            this.animationRequest = requestAnimationFrame(() => this.redraw())
        } else {
            console.log("Image is final")
        }
    }

    protected createTargetTexture(): WebGLTexture {
        const texture = this.gl.createTexture() ?? error("Could not create framebuffer texture")
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGB8,
            ...this.resolution,
            0,
            this.gl.RGB,
            this.gl.UNSIGNED_BYTE,
            null)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
        return texture
    }

    protected setupFramebuffer() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer)
        this.gl.framebufferTexture2D(
            this.gl.DRAW_FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            this.targetTextures[(this.frameIndex + 1) % 2],
            0
        )
    }
    protected setupDataUniformBuffer() {
        const blockIndex = this.gl.getUniformBlockIndex(this.program, "Data")
        const blockSize = this.gl.getActiveUniformBlockParameter(this.program, blockIndex, this.gl.UNIFORM_BLOCK_DATA_SIZE)
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.dataBuffer)
        this.gl.bufferData(this.gl.UNIFORM_BUFFER, blockSize, this.gl.DYNAMIC_DRAW)
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null)
        this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, DATA_UBO_INDEX, this.dataBuffer)
        this.gl.uniformBlockBinding(this.program, blockIndex, DATA_UBO_INDEX)

        const dataIndices = this.gl.getUniformIndices(this.program, ["uData"]) ?? error("uData uniform not found")
        this.dataOffset = this.gl.getActiveUniforms(this.program, dataIndices, this.gl.UNIFORM_OFFSET)[0]
    }

    protected updateDataBuffer(spheres: Sphere[]) {
        const data = new Float32Array(spheres.length * 12)
        let offset = 0;
        for (const sphere of spheres) {
            data.set(sphere.data(), offset)
            offset += 12
        }

        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.dataBuffer)
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, this.dataOffset, data)
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null)
        setUniforms(this.uniformSetters, { uSphereCount: spheres.length })
    }

    protected present() {
        const w = this.gl.drawingBufferWidth, h = this.gl.drawingBufferHeight
        this.gl.bindFramebuffer(this.gl.READ_FRAMEBUFFER, this.framebuffer)
        this.gl.bindFramebuffer(this.gl.DRAW_FRAMEBUFFER, null)
        this.gl.blitFramebuffer(0, 0, ...this.resolution, 0, 0, w, h, this.gl.COLOR_BUFFER_BIT, this.gl.LINEAR)
    }
}

const TEST_SCENE = new Scene(
    new Camera(undefined, undefined, 0.2),
    [
        new Sphere(new Vec3(0.25, 0.25, 1), 0.25, new Material(new Vec3(1, 0.4, 0.4), 0)),
        new Sphere(new Vec3(-0.25, 0.0, 4), 1, new Material(new Vec3(0.4, 1, 0.4), 0.5)),
        new Sphere(new Vec3(0.0, -0.5, 2), 0.5, new Material(new Vec3(0.4, 0.4, 1), 0.98)),
        new Sphere(new Vec3(0, -80, 80), 100),
        new Sphere(new Vec3(-4, 4, 4), 4, new Material(Vec3.ONE, 0.1, Vec3.ONE.mul(0.9))),
        new Sphere(new Vec3(4, 4, 4), 1, new Material(Vec3.ONE, 0.1, new Vec3(0.9, 0.9, 0))),
    ]
)

function setupCameraControls(scene: Scene, view: Renderer) {
    const gd = new GestureDecoder(view.canvas)
    let lx = 0, ly = 0;
    gd.on("dragstart", (e) => { lx = e.x, ly = e.y })
    gd.on("dragupdate", (e) => {
        const dx = e.x - lx, dy = e.y - ly
        lx = e.x, ly = e.y
        scene.camera.rotate(dy / view.canvas.height, dx / view.canvas.width)
        requestAnimationFrame(() => view.draw(scene))
    })
    let startFov = scene.camera.fov
    gd.on("zoomstart", () => startFov = scene.camera.fov)
    gd.on("zoomupdate", (e) => {
        scene.camera.fov = startFov / e.scale
        requestAnimationFrame(() => view.draw(scene))
    })
    view.canvas.addEventListener("wheel", (e) => {
        scene.camera.fov = clamp(scene.camera.fov * (1 + e.deltaY * SCROLL_SENSITIVITY), .1, 3)
        requestAnimationFrame(() => view.draw(scene))
    })
}

function main() {
    const canvas = document.getElementById("main-canvas") as HTMLCanvasElement
    const view = new Renderer(canvas, isMobile() ? .5 : 1)
    const scene = Scene.random()
    // const scene = TEST_SCENE
    window.addEventListener('resize', () => view.resize(window.innerWidth, window.innerHeight))
    view.resize(window.innerWidth, window.innerHeight)
    setupCameraControls(scene, view)
    document.addEventListener("keypress", (e) => {
        switch (e.key) {
            case "1":
                view.bounces = Math.max(0, view.bounces - 1)
                requestAnimationFrame(() => view.draw(scene))
                break
            case "2":
                view.bounces = Math.min(view.bounces + 1, MAX_BOUNCES)
                requestAnimationFrame(() => view.draw(scene))
                break
        }
    })
    requestAnimationFrame(() => view.draw(scene))
}

window.onload = main
