import { compileProgram, setupFullviewQuad } from "./glutil"
import { JuliaConfig, Renderer } from "./irenderer"
import vertexShader from "bundle-text:/src/shaders/identity.vs"
import fragmentShader from "bundle-text:/src/shaders/julia.fs"

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

type JuliaUniforms = {
	uPos: WebGLUniformLocation,
	uDims: WebGLUniformLocation,
	uLim: WebGLUniformLocation,
	uEscapeD: WebGLUniformLocation,
	uInsideColor: WebGLUniformLocation,
	uSeed: WebGLUniformLocation,
}

/** WebGL-based image renderer. */
export default class GpuRenderer implements Renderer {
	rect: DOMRect = new DOMRect(-1, -1, 2, 2)

	private canvas: HTMLCanvasElement
	private gl: WebGLRenderingContext
	private program: WebGLProgram

	private uniforms: JuliaUniforms
	private cachedConfig?: JuliaConfig

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas
		this.gl = canvas.getContext('webgl', CONTEXT_OPTIONS)!

		this.program = compileProgram(this.gl, vertexShader, fragmentShader)
		setupFullviewQuad(this.gl, this.program, 'aPos')

		const widthToHeight = this.canvas.width / this.canvas.height
		this.rect.width *= widthToHeight
		this.rect.x *= widthToHeight

		this.gl.useProgram(this.program)
		this.uniforms = {
			uPos: this.gl.getUniformLocation(this.program, 'uPos')!,
			uDims: this.gl.getUniformLocation(this.program, 'uDims')!,
			uLim: this.gl.getUniformLocation(this.program, 'uLim')!,
			uEscapeD: this.gl.getUniformLocation(this.program, 'uEscapeD')!,
			uInsideColor: this.gl.getUniformLocation(this.program, 'uInsideColor')!,
			uSeed: this.gl.getUniformLocation(this.program, 'uSeed')!,
		}
	}

	resize(width: number, height: number): void {
		const widthToHeight = width / height
		this.rect.height *= height / this.canvas.height
		this.rect.width = this.rect.height * widthToHeight

		this.canvas.width = width
		this.canvas.height = height

		this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight)

		if (this.cachedConfig) {
			this.draw(this.cachedConfig)
		}
	}

	pan(dx: number, dy: number): void {
		this.rect.x -= dx / this.canvas.width * this.rect.width
		this.rect.y += dy / this.canvas.height * this.rect.height

		if (this.cachedConfig) {
			this.draw(this.cachedConfig)
		}
	}

	zoom(x: number, y: number, scale: number): void {
		this.rect.x += x / this.canvas.width * (this.rect.width - this.rect.width * scale)
		this.rect.y += (1 - y / this.canvas.height) * (this.rect.height - this.rect.height * scale)
		this.rect.width *= scale
		this.rect.height *= scale

		if (this.cachedConfig) {
			this.draw(this.cachedConfig)
		}
	}

	draw(config: JuliaConfig): void {
		this.gl.useProgram(this.program)
		this.gl.uniform2f(this.uniforms['uPos'], this.rect.x + this.rect.width * .5, this.rect.y + this.rect.height * .5)
		this.gl.uniform2f(this.uniforms['uDims'], this.rect.width * .5, this.rect.height * .5)
		this.gl.uniform1i(this.uniforms['uLim'], config.limit)
		this.gl.uniform1f(this.uniforms['uEscapeD'], config.escapeR * 2)
		this.gl.uniform2f(this.uniforms['uSeed'], config.seed[0], config.seed[1])
		this.gl.uniform4f(this.uniforms['uInsideColor'], 0, 0, 0, 1)

		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
		this.cachedConfig = config
	}
}
