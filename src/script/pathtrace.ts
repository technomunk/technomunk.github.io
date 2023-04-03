import { compileProgram } from "./lib/glutil"

import vertexShader from "bundle-text:/src/shader/fullscreen.vs"
import fragmentShader from "bundle-text:/src/shader/pathtrace.fs"

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
const DATA_UBO_INDEX = 0;

type UniformLocations = {
    uResolution: WebGLUniformLocation
    uCamFov: WebGLUniformLocation
    uLightColor: WebGLUniformLocation
    uLightDir: WebGLUniformLocation
    uSphereCount: WebGLUniformLocation
}

class Renderer {
    canvas: HTMLCanvasElement
    gl: WebGL2RenderingContext
    program: WebGLProgram
    uniforms: UniformLocations
    dataBuffer: WebGLBuffer
    dataOffset: number

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.gl = canvas.getContext("webgl2", CONTEXT_OPTIONS)!
        this.program = compileProgram(this.gl, vertexShader, fragmentShader)
        this.uniforms = {
            uResolution: this.gl.getUniformLocation(this.program, "uResolution")!,
            uCamFov: this.gl.getUniformLocation(this.program, "uCamFov")!,
            uLightColor: this.gl.getUniformLocation(this.program, "uLightColor")!,
            uLightDir: this.gl.getUniformLocation(this.program, "uLightDir")!,
            uSphereCount: this.gl.getUniformLocation(this.program, "uSphereCount")!,
        }
        this.dataBuffer = this.gl.createBuffer()!;
        this.dataOffset = -1
        this.setupDataUniformBuffer()
        console.log(this)
    }

    resize(width: number, height: number) {
        this.canvas.width = width
        this.canvas.height = height
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight)
        this.draw()
    }

    draw() {
        this.gl.useProgram(this.program)
        const w = this.gl.drawingBufferWidth
        const h = this.gl.drawingBufferHeight

        this.updateDataBuffer()

        this.gl.uniform2f(this.uniforms["uResolution"], w, h)
        this.gl.uniform1f(this.uniforms["uCamFov"], 90 * Math.PI / 180)
        this.gl.uniform3f(this.uniforms["uLightColor"], 1, 1, 1)
        this.gl.uniform3f(this.uniforms["uLightDir"], 0.4, -0.4, 0.1)
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 3)
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

    private updateDataBuffer() {
        const spheres = new Float32Array([
            // red
            0.2, 0.2, 1.0, 0.2,
            1.0, 0.0, 0.0, 0.0,
            // green
            0.1, -0.1, 4.0, 1,
            0.0, 1.0, 0.0, 0.0,
        ])


        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, this.dataBuffer)
        this.gl.bufferSubData(this.gl.UNIFORM_BUFFER, this.dataOffset, spheres)
        this.gl.bindBuffer(this.gl.UNIFORM_BUFFER, null)
        this.gl.uniform1i(this.uniforms["uSphereCount"], 2)
    }
}

function main() {
    const view = new Renderer(document.getElementById("main-canvas") as HTMLCanvasElement)
    window.addEventListener('resize', () => view.resize(window.innerWidth, window.innerHeight))
    view.resize(window.innerWidth, window.innerHeight)
}

window.onload = main
