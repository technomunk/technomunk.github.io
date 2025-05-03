import { error } from '@lib/util';
import { compileProgram } from './util';

import VERTEX_SHADER from '@shader/fullscreen.vs';

export type Uniforms = {
	[key: string]: number | [number, number] | [number, number, number] | [number, number, number, number];
};

export const GL_CONTEXT_OPTIONS: WebGLContextAttributes = {
	alpha: false,
	antialias: false,
	depth: false,
	desynchronized: true,
	failIfMajorPerformanceCaveat: false,
	powerPreference: 'high-performance',
	preserveDrawingBuffer: true,
	stencil: false,
};

/** Helper class for rendering a single triangle in full screen, resulting in the fragment shader
 * UV coordinates corresponding to canvas space.
 */
export default class FragmentRenderer {
	readonly context: WebGL2RenderingContext;
	protected _program!: WebGLProgram;

	constructor(canvas: HTMLCanvasElement | OffscreenCanvas) {
		this.context = canvas.getContext('webgl2', GL_CONTEXT_OPTIONS) || error('Could not get WebGL2 rendering context');
	}

	get program(): WebGLProgram {
		return this._program;
	}

	setShader(shader: string) {
		this._program = compileProgram(this.context, VERTEX_SHADER, shader);
		this.context.useProgram(this._program);
	}

	draw(uniforms?: Uniforms) {
		if (uniforms) {
			this._setUniforms(uniforms);
		}
		this.context.drawArrays(this.context.TRIANGLE_STRIP, 0, 3);
	}

	drawWithShader(shader: string, uniforms?: Uniforms) {
		this.setShader(shader);
		this.draw(uniforms);
	}

	/** Update the internal rendering buffer size to match the canvas one. */
	updateSize() {
		this.context.viewport(0, 0, this.context.drawingBufferWidth, this.context.drawingBufferHeight);
	}

	protected _setUniforms(uniforms: Uniforms) {
		if (this.program === undefined) {
			throw 'Shader not set';
		}

		for (const [name, value] of Object.entries(uniforms)) {
			const location = this.context.getUniformLocation(this.program, name);
			if (!location) {
				throw `"${name}" uniform could not be found`;
			}
			if (Array.isArray(value)) {
				switch (value.length) {
					case 2:
						this.context.uniform2f(location, ...value);
						break;
					case 3:
						this.context.uniform3f(location, ...value);
						break;
					case 4:
						this.context.uniform4f(location, ...value);
						break;
				}
			} else {
				this.context.uniform1i(location, value);
			}
		}
	}
}
