import { compileProgram, setupFullviewQuad } from "./glutil";

/** WebGL-based image renderer.
 */
class GpuRenderer implements Renderer {
	rect: DOMRect = new DOMRect(-1, -1, 2, 2);
	
	private canvas: HTMLCanvasElement;
	private gl: WebGLRenderingContext;
	private program: WebGLProgram;

	private uPosLoc: WebGLUniformLocation;
	private uDimsLoc: WebGLUniformLocation;
	private uLimLoc: WebGLUniformLocation;
	private uInsideColorLoc: WebGLUniformLocation;
	private cachedConfig: {} | undefined;

	constructor(canvas: HTMLCanvasElement, vertex: string, fragment: string) {
		this.canvas = canvas;
		this.gl = canvas.getContext('webgl')!;

		this.program = compileProgram(this.gl, vertex, fragment);
		setupFullviewQuad(this.gl, this.program, 'aPos');

		const widthToHeight = this.canvas.width / this.canvas.height;
		this.rect.width *= widthToHeight;
		this.rect.x *= widthToHeight;

		this.gl.useProgram(this.program);
		this.uPosLoc = this.gl.getUniformLocation(this.program, 'uPos')!;
		this.uDimsLoc = this.gl.getUniformLocation(this.program, 'uDims')!;
		this.uLimLoc = this.gl.getUniformLocation(this.program, 'uLim')!;
		this.uInsideColorLoc = this.gl.getUniformLocation(this.program, 'uInsideColor')!;
	}

	resize(width: number, height: number): void {
		this.rect.width *= width / this.canvas.width;
		this.rect.height *= height / this.canvas.height;
		this.canvas.width = width;
		this.canvas.height = height;

		if (this.cachedConfig) {
			this.draw(this.cachedConfig);
		}
	}
	pan(dx: number, dy: number): void {
		this.rect.x -= dx / this.canvas.width * this.rect.width;
		this.rect.y += dy / this.canvas.height * this.rect.height;

		if (this.cachedConfig) {
			this.draw(this.cachedConfig);
		}
	}
	zoom(x: number, y: number, scale: number): void {
		this.rect.x += x / this.canvas.width * (this.rect.width - this.rect.width * scale);
		this.rect.y += (1 - y / this.canvas.height) * (this.rect.height - this.rect.height * scale);
		this.rect.width *= scale;
		this.rect.height *= scale;

		if (this.cachedConfig) {
			this.draw(this.cachedConfig);
		}
	}

	draw(config: any): void {
		this.gl.useProgram(this.program);
		this.gl.uniform2f(this.uPosLoc, this.centerX, this.centerY);
		this.gl.uniform2f(this.uDimsLoc, this.rect.width*.5, this.rect.height*.5);
		this.gl.uniform1i(this.uLimLoc, 32);
		this.gl.uniform4f(this.uInsideColorLoc, 0, 0, 0, 1);

		this.gl.clearColor(0, 0, 0, 1);
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
		this.cachedConfig = config;
	}

	get centerX() {
		return this.rect.x + this.rect.width*.5;
	}

	get centerY() {
		return this.rect.y + this.rect.height*.5;
	}
}

export function init_gpu_renderer(
	canvas: HTMLCanvasElement,
	type: ImageType)
	: Promise<GpuRenderer>
{
	return Promise.all([
		fetch('shaders/identity.vs', { mode: "same-origin", }).then(response => response.text()),
		fetch(`shaders/${type}.fs`, { mode: "same-origin", }).then(response => response.text()),
	]).then(([vertex, fragment]) => new GpuRenderer(canvas, vertex, fragment));
}
