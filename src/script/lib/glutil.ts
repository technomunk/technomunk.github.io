/* eslint-disable no-mixed-spaces-and-tabs */

import { error } from "./util"
import { Vec3, vec3 } from "./vec3"

/** Compile a shader from the provided source.
 * @param gl The rendering context to compile the shader with.
 * @param type The type of the shader to compile.
 * @param source The source code of the shader to compile.
 * @returns Successfully compiled shader.
 * @throws Errors if the compilation failed.
 */
export function compileShader(
	gl: WebGLRenderingContext,
	type: GLenum,
	source: string
): WebGLShader {
	const shader = gl.createShader(type)
	if (shader == null) {
		throw new Error(`Failed to create a shader of type: ${type}`)
	}

	gl.shaderSource(shader, source)
	gl.compileShader(shader)

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const message = "Failed to compile shader:\n" + gl.getShaderInfoLog(shader)
		gl.deleteShader(shader)
		throw new Error(message)
	}

	return shader
}

/** Compile a shader program using provided vertex and fragment shader sources.
 * @param gl The rendering context to compile the shader program with.
 * @param vertexSource The source code of the vertex shader.
 * @param fragmentSource The source code of the fragment shader.
 * @returns Successfully compiled shader program.
 * @throws Errors if the compiled failed for some reason.
 */
export function compileProgram(
	gl: WebGLRenderingContext,
	vertexSource: string,
	fragmentSource: string
): WebGLProgram {
	const program = gl.createProgram()
	if (program == null) {
		throw new Error("Failed to create a GL program")
	}

	const vertexShader = gl.createShader(gl.VERTEX_SHADER)
	if (!vertexShader) {
		gl.deleteProgram(program)
		throw new Error("Failed to create vertex shader!")
	}

	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
	if (!fragmentShader) {
		gl.deleteProgram(program)
		gl.deleteShader(vertexShader)
		throw new Error("Failed to create fragment shader!")
	}

	gl.shaderSource(vertexShader, vertexSource)
	gl.shaderSource(fragmentShader, fragmentSource)
	gl.attachShader(program, vertexShader)
	gl.attachShader(program, fragmentShader)

	gl.compileShader(vertexShader)
	gl.compileShader(fragmentShader)

	gl.linkProgram(program)


	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		let message = "Failed to link shader program:"
		const programInfo = gl.getProgramInfoLog(program)
		if (programInfo) {
			message += '\n' + programInfo
		}
		const vertexShaderInfo = gl.getShaderInfoLog(vertexShader)
		if (vertexShaderInfo) {
			message += "Vertex shader log:\n" + vertexShaderInfo
		}
		const fragmentShaderInfo = gl.getShaderInfoLog(fragmentShader)
		if (fragmentShaderInfo) {
			message += "Fragment shader log:\n" + fragmentShaderInfo
		}

		gl.deleteShader(vertexShader)
		gl.deleteShader(fragmentShader)
		gl.deleteProgram(program)

		throw new Error(message)
	}

	// Once the program is linked the shaders are no longer needed, free the resources.
	gl.deleteShader(vertexShader)
	gl.deleteShader(fragmentShader)

	return program
}

export function logDebugInfo(gl: WebGLRenderingContext): void {
	console.dir({
		language: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
		vendor: gl.getParameter(gl.VENDOR),
		version: gl.getParameter(gl.VERSION),
		renderer: gl.getParameter(gl.RENDERER),
		extensions: gl.getSupportedExtensions(),
		precision: {
			vertex_float_low: gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.LOW_FLOAT),
			vertex_float_medium: gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_FLOAT),
			vertex_float_high: gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT),
			vertex_int_low: gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.LOW_INT),
			vertex_int_medium: gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_INT),
			vertex_int_high: gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_INT),
			fragment_float_low: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_FLOAT),
			fragment_float_medium: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT),
			fragment_float_high: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT),
			fragment_int_low: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.LOW_INT),
			fragment_int_medium: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_INT),
			fragment_int_high: gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_INT),
		}
	})
}

export type UniformSetters = {
	[key: string]: (value: any) => void
}
export type UniformValues = {
	[key: string]: number | Iterable<number> | WebGLTexture
}

export function composeUniformSetters(gl: WebGLRenderingContext, program: WebGLProgram): UniformSetters {
	const uniformCount: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
	const uniformSetters: UniformSetters = {}

	for (let i = 0; i < uniformCount; ++i) {
		const uniformInfo = gl.getActiveUniform(program, i) ?? error(`Inactive uniform at ${i}`)
		let name = uniformInfo.name
		if (name.endsWith("[0]")) {
			name = name.substring(0, name.length - 3)
		}
		uniformSetters[name] = createUniformSetter(gl, program, uniformInfo)
	}

	return uniformSetters
}

export function setUniforms(setters: UniformSetters, ...values: Array<UniformValues>): void {
	for (const uniforms of values) {
		for (const name of Object.keys(uniforms)) {
			const setter = setters[name]
			if (setter) {
				setter(uniforms[name])
			} else {
				console.warn("Unknown uniform:", name)
			}
		}
	}
}

function createUniformSetter(
	gl: WebGLRenderingContext,
	program: WebGLProgram,
	uniformInfo: WebGLActiveInfo
): (v: any) => void {
	const loc = gl.getUniformLocation(program, uniformInfo.name)
	switch (uniformInfo.type) {
		case gl.FLOAT:
			return (v) => gl.uniform1f(loc, v)
		case gl.INT:
			return (v) => gl.uniform1i(loc, v)
		case gl.FLOAT_VEC2:
			return (v) => gl.uniform2fv(loc, v)
		case gl.FLOAT_VEC3:
			return (v) => gl.uniform3fv(loc, v)
		case gl.FLOAT_VEC4:
			return (v) => gl.uniform4fv(loc, v)
		case gl.FLOAT_MAT3:
			return (v) => gl.uniformMatrix3fv(loc, false, v)
		case gl.SAMPLER_2D:
			return (v) => {
				gl.activeTexture(gl.TEXTURE0)
				gl.bindTexture(gl.TEXTURE_2D, v)
			}
		default:
			error(`Unknown uniform type: 0x${uniformInfo.type.toString(16)}, (${uniformInfo.name})`)
	}
}
