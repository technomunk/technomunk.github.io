import { compileProgram } from "./glutil"
import ComplexPlaneView from "./complexview"

import vertexShader from "bundle-text:/src/shader/fullscreen.vs"
import fragmentShader from "bundle-text:/src/shader/julia.fs"

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
	uStep: WebGLUniformLocation,
	uLim: WebGLUniformLocation,
	uSeed: WebGLUniformLocation,
}

export type JuliaConfig = { limit: number, seed: [number, number] }

export default class JuliaView extends ComplexPlaneView {
	config: JuliaConfig = { limit: 32, seed: [0, 0] }

	private gl: WebGLRenderingContext
	private program: WebGLProgram
	private uniforms: JuliaUniforms

	constructor() {
		super()

		this.gl = this.getContext('webgl2', CONTEXT_OPTIONS)!
		this.program = compileProgram(this.gl, vertexShader, fragmentShader)
		this.gl.useProgram(this.program)
		this.uniforms = {
			uPos: this.gl.getUniformLocation(this.program, 'uPos')!,
			uStep: this.gl.getUniformLocation(this.program, 'uStep')!,
			uLim: this.gl.getUniformLocation(this.program, 'uLim')!,
			uSeed: this.gl.getUniformLocation(this.program, 'uSeed')!,
		}
	}

	resize(width: number, height: number) {
		this.resizeCanvas(width, height)
		this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight)
		this.draw()
	}

	draw() {
		this.gl.useProgram(this.program)
		this.gl.uniform2f(this.uniforms['uPos'], this.view.minX, this.view.minY)
		this.gl.uniform2f(this.uniforms['uStep'], this.view.width / this.width, this.view.height / this.height)
		this.gl.uniform1i(this.uniforms['uLim'], this.config.limit)
		this.gl.uniform2f(this.uniforms['uSeed'], this.config.seed[0], this.config.seed[1])
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 3)
	}
}
