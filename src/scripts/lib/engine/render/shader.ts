import type { MeshBufferSet } from './mesh-buffer';

export interface TextureWithSampler {
	texture: WebGLTexture;
	sampler: WebGLSampler;
}

export type UniformValue =
	| number
	| Iterable<number>
	| WebGLTexture
	| TextureWithSampler
	| Array<TextureWithSampler>;
export type UniformSetter<V extends UniformValue = UniformValue> = (value: V) => void;
export type UniformSet = Record<string, UniformValue>;
export type UniformSetterSet<U extends UniformSet = UniformSet> = {
	[K in keyof U]: UniformSetter<U[K]>;
};

export interface ShaderProps {
	gl: WebGL2RenderingContext;
	src: {
		vertex: string;
		fragment: string;
	};
}

interface ShaderWithSource {
	shader: WebGLShader;
	source: string;
}

type DrawMode =
	| WebGL2RenderingContext['POINTS']
	| WebGL2RenderingContext['LINES']
	| WebGL2RenderingContext['LINE_LOOP']
	| WebGL2RenderingContext['LINE_STRIP']
	| WebGL2RenderingContext['TRIANGLES']
	| WebGL2RenderingContext['TRIANGLE_FAN']
	| WebGL2RenderingContext['TRIANGLE_STRIP'];

export class ShaderError extends Error {}

/** A GPU program along with related information */
export class Shader<Uniforms extends UniformSet = UniformSet> {
	readonly gl: WebGL2RenderingContext;
	readonly program: WebGLProgram;
	readonly uniformSetters: UniformSetterSet<Uniforms>;
	readonly attributes: Record<string, GLuint>;

	constructor({ gl, src }: ShaderProps) {
		this.gl = gl;
		this.program = gl.createProgram();

		const vertexShader = gl.createShader(gl.VERTEX_SHADER);
		const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

		try {
			if (!vertexShader) throw new ShaderError("Couldn't allocate vertex shader");
			if (!fragmentShader) throw new ShaderError("Couldn't allocate fragmentShader");

			this.compileAndLink(
				{ shader: vertexShader, source: src.vertex },
				{ shader: fragmentShader, source: src.fragment },
			);
			this.uniformSetters = detail.createUniformSetters(this.gl, this.program);
			this.attributes = detail.collectAttributeLocations(this.gl, this.program);
		} catch (error) {
			gl.deleteProgram(this.program);
			throw error;
		} finally {
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
		}
	}

	use() {
		this.gl.useProgram(this.program);
	}

	setUniforms(uniforms: Partial<Uniforms>) {
		for (const name of Object.keys(uniforms)) {
			const setter = this.uniformSetters[name];
			// biome-ignore lint/suspicious/noExplicitAny: Partial<Uniforms> ensures our values are correct
			setter(uniforms[name] as any);
		}
	}

	draw = (buffers: MeshBufferSet, mode: DrawMode = WebGL2RenderingContext.TRIANGLES) => {
		this.gl.bindVertexArray(buffers.vao);
		if (buffers.index) {
			this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffers.index.buffer);
			this.gl.drawElements(mode, buffers.vertexCount, buffers.index.type, 0);
		} else {
			this.gl.drawArrays(mode, 0, buffers.vertexCount);
		}
	};

	/** Clean up allocated resources for this shader.
	 * Note that the shader becomes unusable afterwards.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: intentionally mark an unusable shader
	dispose(): this & Omit<Shader, any> {
		this.gl.deleteProgram(this.program);
		return this;
	}

	protected compileAndLink(vertex: ShaderWithSource, fragment: ShaderWithSource) {
		this.gl.shaderSource(vertex.shader, vertex.source);
		this.gl.shaderSource(fragment.shader, fragment.source);

		this.gl.attachShader(this.program, vertex.shader);
		this.gl.attachShader(this.program, fragment.shader);

		this.gl.compileShader(vertex.shader);
		this.gl.compileShader(fragment.shader);

		this.gl.linkProgram(this.program);

		if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
			let message = 'Failed to link shader program:';
			let info = this.gl.getProgramInfoLog(this.program);
			if (info) message += `\n${info}`;
			info = this.gl.getShaderInfoLog(vertex.shader);
			if (info) message += `\nVertex shader log:\n${info}`;
			info = this.gl.getShaderInfoLog(fragment.shader);
			if (info) message += `\nFragment shader log:\n${info}`;

			throw new ShaderError(message);
		}
	}
}

namespace detail {
	// biome-ignore lint/suspicious/noExplicitAny: this is a typegard, ree
	const isTextureWithSampler = (v: any): v is TextureWithSampler =>
		'texture' in v && 'sampler' in v;

	const isBuiltIn = (info: WebGLActiveInfo) =>
		info.name.startsWith('gl_') || info.name.startsWith('webgl_');

	type Ref<T> = { value: T };

	type TextureType =
		| WebGL2RenderingContext['SAMPLER_2D']
		| WebGL2RenderingContext['SAMPLER_2D_ARRAY']
		| WebGL2RenderingContext['SAMPLER_2D_SHADOW']
		| WebGL2RenderingContext['SAMPLER_2D_ARRAY_SHADOW']
		| WebGL2RenderingContext['SAMPLER_3D']
		| WebGL2RenderingContext['SAMPLER_CUBE']
		| WebGL2RenderingContext['SAMPLER_CUBE_SHADOW'];

	type TextureTarget =
		| WebGL2RenderingContext['TEXTURE_2D']
		| WebGL2RenderingContext['TEXTURE_2D_ARRAY']
		| WebGL2RenderingContext['TEXTURE_CUBE_MAP'];

	export const createUniformSetters = <U extends UniformSet>(
		gl: WebGL2RenderingContext,
		program: WebGLProgram,
	): UniformSetterSet<U> => {
		const textureUnit = { value: 0 };
		const result: Record<string, UniformSetter> = {};

		const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
		for (let i = 0; i < uniformCount; ++i) {
			// biome-ignore lint/style/noNonNullAssertion: we are iterating over the correct range
			const info = gl.getActiveUniform(program, i)!;
			if (isBuiltIn(info)) continue;

			const setter = createUniformSetter(gl, program, info, textureUnit);
			if (!setter) continue;
			const name = info.name.endsWith('[0]')
				? info.name.substring(0, info.name.length - 3)
				: info.name;
			result[name] = setter as UniformSetter;
		}

		return result as UniformSetterSet<U>;
	};

	export const collectAttributeLocations = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
		const result: Record<string, GLuint> = {};
		const attributeCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
		for (let i = 0; i < attributeCount; ++i) {
			// biome-ignore lint/style/noNonNullAssertion: we are iterating over the correct range
			const info = gl.getActiveAttrib(program, i)!;
			if (isBuiltIn(info)) continue;
			const loc = gl.getAttribLocation(program, info.name);
			if (loc < 0) continue;
			result[info.name] = loc;
		}
		return result;
	};

	const createUniformSetter = (
		gl: WebGL2RenderingContext,
		program: WebGLProgram,
		info: WebGLActiveInfo,
		textureUnit: Ref<number>,
	) => {
		const isArray = info.name.endsWith('[0]');
		const name = isArray ? info.name.substring(0, info.name.length - 3) : info.name;

		const loc = gl.getUniformLocation(program, name);
		if (!loc) {
			return;
		}

		switch (info.type) {
			// floats
			case gl.FLOAT:
				return isArray
					? (v: Iterable<number>) => gl.uniform1fv(loc, v)
					: (v: number) => gl.uniform1f(loc, v);
			case gl.FLOAT_VEC2:
				return (v: Iterable<number>) => gl.uniform2fv(loc, v);
			case gl.FLOAT_VEC3:
				return (v: Iterable<number>) => gl.uniform3fv(loc, v);
			case gl.FLOAT_VEC4:
				return (v: Iterable<number>) => gl.uniform4fv(loc, v);
			case gl.FLOAT_MAT2:
				return (v: Iterable<number>) => gl.uniformMatrix2fv(loc, false, v);
			case gl.FLOAT_MAT2x3:
				return (v: Iterable<number>) => gl.uniformMatrix2x3fv(loc, false, v);
			case gl.FLOAT_MAT2x4:
				return (v: Iterable<number>) => gl.uniformMatrix2x4fv(loc, false, v);
			case gl.FLOAT_MAT3:
				return (v: Iterable<number>) => gl.uniformMatrix3fv(loc, false, v);
			case gl.FLOAT_MAT3x2:
				return (v: Iterable<number>) => gl.uniformMatrix3x2fv(loc, false, v);
			case gl.FLOAT_MAT3x4:
				return (v: Iterable<number>) => gl.uniformMatrix3x4fv(loc, false, v);
			case gl.FLOAT_MAT4:
				return (v: Iterable<number>) => gl.uniformMatrix4fv(loc, false, v);
			case gl.FLOAT_MAT4x2:
				return (v: Iterable<number>) => gl.uniformMatrix4x2fv(loc, false, v);
			case gl.FLOAT_MAT4x3:
				return (v: Iterable<number>) => gl.uniformMatrix4x3fv(loc, false, v);
			// integers
			case gl.INT:
			case gl.BOOL:
				return isArray
					? (v: Iterable<number>) => gl.uniform1iv(loc, v)
					: (v: number) => gl.uniform1i(loc, v);
			case gl.INT_VEC2:
			case gl.BOOL_VEC2:
				return (v: Iterable<number>) => gl.uniform2iv(loc, v);
			case gl.INT_VEC3:
			case gl.BOOL_VEC3:
				return (v: Iterable<number>) => gl.uniform3iv(loc, v);
			case gl.INT_VEC4:
			case gl.BOOL_VEC4:
				return (v: Iterable<number>) => gl.uniform4iv(loc, v);
			case gl.UNSIGNED_INT:
				return isArray
					? (v: Iterable<number>) => gl.uniform1uiv(loc, v)
					: (v: number) => gl.uniform1ui(loc, v);
			case gl.UNSIGNED_INT_VEC2:
				return (v: Iterable<number>) => gl.uniform2uiv(loc, v);
			case gl.UNSIGNED_INT_VEC3:
				return (v: Iterable<number>) => gl.uniform3uiv(loc, v);
			case gl.UNSIGNED_INT_VEC4:
				return (v: Iterable<number>) => gl.uniform4uiv(loc, v);
			// textures
			case gl.SAMPLER_2D:
			case gl.SAMPLER_2D_ARRAY:
			case gl.SAMPLER_2D_SHADOW:
			case gl.SAMPLER_2D_ARRAY_SHADOW:
			case gl.SAMPLER_CUBE:
			case gl.SAMPLER_CUBE_SHADOW:
			case gl.SAMPLER_3D: {
				const unit = textureUnit.value;
				textureUnit.value += info.size;
				return isArray
					? createSamplerArraySetter(gl, info.type, unit, loc)
					: createSamplerSetter(gl, info.type, unit, loc);
			}
			default:
				throw new Error(`Unknown uniform type: 0x${info.type.toString(16)}, (${info.name})`);
		}
	};

	const createSamplerSetter = (
		gl: WebGL2RenderingContext,
		type: TextureType,
		unit: number,
		loc: WebGLUniformLocation,
	) => {
		const target = getTextureTarget(gl, type);

		return (v: WebGLTexture | TextureWithSampler) => {
			let texture: WebGLTexture;
			let sampler: WebGLSampler | null;
			if (isTextureWithSampler(v)) {
				texture = v.texture;
				sampler = v.sampler;
			} else {
				texture = v;
				sampler = null;
			}
			gl.uniform1i(loc, unit);
			gl.activeTexture(gl.TEXTURE0 + unit);
			gl.bindTexture(target, texture);
			gl.bindSampler(unit, sampler);
		};
	};

	const createSamplerArraySetter = (
		gl: WebGL2RenderingContext,
		type: TextureType,
		unit: number,
		loc: WebGLUniformLocation,
	) => {
		const target = getTextureTarget(gl, type);

		return (v: Array<WebGLTexture | TextureWithSampler>) => {
			gl.uniform1i(loc, unit);

			v.forEach((x, idx) => {
				let texture: WebGLTexture;
				let sampler: WebGLSampler | null;
				if (isTextureWithSampler(x)) {
					texture = x.texture;
					sampler = x.sampler;
				} else {
					texture = x;
					sampler = null;
				}
				gl.activeTexture(gl.TEXTURE0 + unit + idx);
				gl.bindTexture(target, texture);
				gl.bindSampler(unit, sampler);
			});
		};
	};

	const getTextureTarget = (gl: WebGL2RenderingContext, type: TextureType): TextureTarget => {
		switch (type) {
			case gl.SAMPLER_2D:
			case gl.SAMPLER_2D_SHADOW:
				return gl.TEXTURE_2D;
			case gl.SAMPLER_2D_ARRAY:
			case gl.SAMPLER_2D_ARRAY_SHADOW:
				return gl.TEXTURE_2D_ARRAY;
			case gl.SAMPLER_CUBE:
			case gl.SAMPLER_CUBE_SHADOW:
				return gl.TEXTURE_CUBE_MAP;
			default:
				throw new Error(`Unknown texture type: 0x${type.toString(16)}`);
		}
	};
}
