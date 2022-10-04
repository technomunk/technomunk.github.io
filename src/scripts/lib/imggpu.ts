import { compileProgram, setupFullviewQuad } from "./glutil"
import vertexShader from "bundle-text:/src/shaders/fullscreen.vs"

const CONTEXT_OPTIONS: WebGLContextAttributes = {
    alpha: false,
    depth: false,
    desynchronized: true,
    failIfMajorPerformanceCaveat: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: true,
    stencil: false,
}

export interface ImageOptions {
    width: number,
    height: number,
    shader: string,
}

export type Uniforms = {
    [key: string]: number | [number, number] | [number, number, number] | [number, number, number, number]
}

export default class ImageGenerator {
    private canvas: HTMLCanvasElement
    private gl: WebGLRenderingContext

    constructor() {
        this.canvas = document.createElement("canvas")
        const gl = this.canvas.getContext("webgl2", CONTEXT_OPTIONS)
        if (gl) {
            this.gl = gl 
        } else {
            throw "WebGL not supported"
        }
    }

    draw(shader: string, width: number, height: number, uniforms: Uniforms): CanvasImageSource {
        if (width != this.canvas.width || height != this.canvas.height) {
            this.resize(width, height)
        }

        const program = compileProgram(this.gl, vertexShader, shader)    
        this.gl.useProgram(program)
    
        for (const [name, value] of Object.entries(uniforms)) {
            const location = this.gl.getUniformLocation(program, name)
            if (!location) {
                throw `"${name}" uniform could not be found`
            }
            if (value instanceof Array) {
                switch (value.length) {
                    case 2: this.gl.uniform2f(location, ...value); break
                    case 3: this.gl.uniform3f(location, ...value); break
                    case 4: this.gl.uniform4f(location, ...value); break
                }
            } else {
                this.gl.uniform1i(location, value)
            }
        }
    
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 3);
    
        return this.canvas
    }

    private resize(width: number, height: number) {
        this.canvas.width = width, this.canvas.height = height
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight)
    }
}
