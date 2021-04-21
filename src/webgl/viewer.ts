import { setupScreenRenderer } from "./frag_renderer";

export class Viewer<C> {
	
	private gl: WebGLRenderingContext;
	private program: WebGLProgram;
	private uniforms: { [Property in keyof C]: WebGLUniformLocation };

	constructor(
		gl: WebGLRenderingContext,
		program: WebGLProgram,
		uniforms: { [Property in keyof C]: WebGLUniformLocation }
	) {
		this.gl = gl;
		this.program = program;
		this.uniforms = uniforms;
	}

	public set<T extends keyof C>(key: T, x: number, y?: number, z?: number, w?: number) {
		this.gl.useProgram(this.program);
		if (y != null) {
			if (z != null) {
				if (w != null) {
					this.gl.uniform4f(this.uniforms[key], x, y, z, w);
				} else {
					this.gl.uniform3f(this.uniforms[key], x, y, z);
				}
			} else {
				this.gl.uniform2f(this.uniforms[key], x, y);
			}
		} else {
			this.gl.uniform1f(this.uniforms[key], x);
		}
	}

	public seti<T extends keyof C>(key: T, x: number, y?: number, z?: number, w?: number) {
		this.gl.useProgram(this.program);
		if (y != null) {
			if (z != null) {
				if (w != null) {
					this.gl.uniform4i(this.uniforms[key], x, y, z, w);
				} else {
					this.gl.uniform3i(this.uniforms[key], x, y, z);
				}
			} else {
				this.gl.uniform2i(this.uniforms[key], x, y);
			}
		} else {
			this.gl.uniform1i(this.uniforms[key], x);
		}
	}

	public draw() {
		this.gl.useProgram(this.program);
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
	}

	public requestDraw() {
		requestAnimationFrame(() => this.draw());
	}
}

export default function createViewer<T extends {[name: string]: any}>(
	canvas: HTMLCanvasElement,
	fragSrc: string,
	uniforms: T,
): Viewer<T> | undefined {
	const gl = canvas.getContext('webgl');
	if (gl == null) {
		console.error("Failed to get a WebGL context!");
		return undefined;
	}

	const program = setupScreenRenderer(gl, fragSrc);

	if (program == null) {
		console.error("Failed to setup screen renderer!");
		return undefined;
	}

	let uniformLocations: { [name: string]: WebGLUniformLocation } = {};
	for (const name in uniforms) {
		const location = gl.getUniformLocation(program, name);
		if (location == null) {
			console.error(`Failed to find "${name}" uniform in the supplied shader!`);
			gl.deleteProgram(program);
			return undefined;
		}
		uniformLocations[name] = location;
	}

	const uniformLocs = uniformLocations as { [Property in keyof T]: WebGLUniformLocation };
	return new Viewer(gl, program, uniformLocs);
}
