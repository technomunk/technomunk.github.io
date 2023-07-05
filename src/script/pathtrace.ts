import { UniformSetters, compileProgram, composeUniformSetters, logDebugInfo, setUniforms } from "./lib/glutil"
import vertexShader from "/src/shader/pathtrace.vs"
import fragmentShader from "/src/shader/pathtrace.fs"
import { Bounds, Choice, clamp, error, isMobile, randRange } from "./lib/util"
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
const SPHERE_SPREAD = .8

interface MaterialBounds {
    albedo?: Bounds<Vec3> | Choice<Vec3>,
    smoothness?: Bounds<number> | Choice<number>,
    emissiveness?: Bounds<number> | Choice<number>,
}

class Material {
    albedo: Vec3
    smoothness: number
    emissiveness: number  // multiplier for the albedo

    constructor(albedo: Vec3 = Vec3.ONE, smoothness = 0.5, emissiveness = 0) {
        this.albedo = albedo
        this.smoothness = smoothness
        this.emissiveness = emissiveness
    }

    *data(): Iterable<number> {
        yield* this.albedo
        yield this.emissiveness
        yield this.smoothness
    }

    static random(bounds: MaterialBounds = {}) {
        return new Material(
            bounds.albedo instanceof Choice ? bounds.albedo.random() : Vec3.random(bounds.albedo?.[0] || Vec3.ZERO, bounds.albedo?.[1] || Vec3.ONE),
            bounds.smoothness instanceof Choice ? bounds.smoothness.random() : randRange(bounds.smoothness?.[0] || 0, bounds.smoothness?.[1] || 1),
            bounds.emissiveness instanceof Choice ? bounds.emissiveness.random() : randRange(bounds.emissiveness?.[0] || 0, bounds.emissiveness?.[1] || 1),
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

    static STRIDE = 12

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
            ...this.material.data()
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
    skyBrightness: number

    constructor(camera = new Camera(), spheres: Sphere[] = [], light: Light = { dir: Vec3.ZERO, color: Vec3.ZERO }, ambient = Vec3.ZERO, skyBrightness = 1) {
        this.camera = camera
        this.spheres = spheres
        this.light = light
        this.ambient = ambient
        this.skyBrightness = skyBrightness
    }

    static random(): Scene {
        const r = window.innerWidth / window.innerHeight;
        let w, h;
        if (r > 1) {
            w = r * SPHERE_SPREAD;
            h = SPHERE_SPREAD;
        } else {
            w = SPHERE_SPREAD;
            h = SPHERE_SPREAD / r;
        }
        const scene = new Scene()
        for (let i = 0; i < 32; ++i) {
            scene.spheres.push(
                Sphere.random({
                    pos: [new Vec3(-w, -h, -w), new Vec3(w, h, w)],
                    material: {
                        albedo: [Vec3.ONE.mul(0.1), Vec3.ONE],
                        emissiveness: [0, 0],
                        smoothness: new Choice(.1, .5, .8, .9, .99, .999),
                    }
                }))
            if (Math.random() > 0.85) {
                scene.spheres[i].material.emissiveness = randRange(1, 10)
            }
        }

        scene.light.dir = Vec3.random(Vec3.ONE.mul(-1), new Vec3(1, 0, 1)).normalized()
        let brightness = randRange(1, 2)
        scene.light.color = Vec3.ONE.mul(brightness)
        brightness = randRange(0.0, 0.3)
        scene.ambient = Vec3.ONE.mul(brightness)

        scene.skyBrightness = randRange(1, 3)

        return scene
    }

    static test(): Scene {
        return new Scene(
            new Camera(Vec3.Z.mul(-5), Vec3.Z, 0.5),
            [
                new Sphere(Vec3.ZERO, .5, new Material(Vec3.ONE, 1, 0)),
            ]
        )
    }

    static benchmark(spheresPerSide = 16) {
        return new Scene()
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
    protected skyboxTexture: WebGLTexture
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
        this.skyboxTexture = this.setupSkyboxTexture()
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
            uSkyBrightness: scene.skyBrightness,
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
            uSkybox: this.skyboxTexture,
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
        this.gl.activeTexture(this.gl.TEXTURE0)
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
        const data = new Float32Array(spheres.length * Sphere.STRIDE)
        let offset = 0;
        for (const sphere of spheres) {
            data.set(sphere.data(), offset)
            offset += Sphere.STRIDE
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

    protected setupSkyboxTexture(): WebGLTexture {
        const texture = this.gl.createTexture() ?? error("Could not allocate cubemap texture")
        this.gl.activeTexture(this.gl.TEXTURE1)
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, texture)
        const faces = [
            {
                target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                url: new URL(`/src/img/x-.png`, import.meta.url),
            },
            {
                target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_X,
                url: new URL(`/src/img/x+.png`, import.meta.url),
            },
            {
                target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                url: new URL(`/src/img/y-.png`, import.meta.url),
            },
            {
                target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
                url: new URL(`/src/img/y+.png`, import.meta.url),
            },
            {
                target: this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
                url: new URL(`/src/img/z-.png`, import.meta.url),
            },
            {
                target: this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
                url: new URL(`/src/img/z+.png`, import.meta.url),
            },
        ]
        for (const {target, url} of faces) {
            this.gl.texImage2D(target, 0, this.gl.RGB, 2048, 2048, 0, this.gl.RGB, this.gl.UNSIGNED_BYTE, null)
            const image = new Image()
            image.src = url.toString()
            image.addEventListener("load", () => {
                this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, texture)
                this.gl.texImage2D(target, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, image)
            })
        }
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
        return texture
    }
}

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
