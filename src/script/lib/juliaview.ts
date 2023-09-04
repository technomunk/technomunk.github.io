import { UniformSetters, compileProgram, composeUniformSetters, setUniforms } from "./glutil"
import ComplexPlaneView from "./complexview"

import { error } from "./util"

const vertexShader = require("../../shader/fullscreen.vs")
const fragmentShader = require("../../shader/julia.fs")

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

export type JuliaConfig = { limit: number, seed: [number, number] }

export default class JuliaView extends ComplexPlaneView {
	config: JuliaConfig = { limit: 32, seed: [0, 0] }

	protected gl: WebGLRenderingContext
	protected program: WebGLProgram
	protected uniformSetters: UniformSetters

	constructor() {
		super()

		this.gl = this.getContext('webgl2', CONTEXT_OPTIONS) ?? error("Could not get WebGL2 context")
		this.program = compileProgram(this.gl, vertexShader, fragmentShader)
		this.gl.useProgram(this.program)
		this.uniformSetters = composeUniformSetters(this.gl, this.program)
	}

	resize(width: number, height: number): void {
		this.resizeCanvas(width, height)
		this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight)
		this.draw()
	}

	draw(): void {
		this.gl.useProgram(this.program)
		setUniforms(this.uniformSetters, {
			uPos: [this.view.minX, this.view.minY],
			uStep: [this.view.width / this.width, this.view.height / this.height],
			uLim: this.config.limit,
			uSeed: this.config.seed,
		})
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 3)
	}
}
