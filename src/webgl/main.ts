// let vertexShader = fetch('shaders/identity.vs');

function main() {
	let canvas = document.getElementById('canvas') as HTMLCanvasElement;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	let gl = canvas.getContext('webgl', { alpha: false, });
	
	if (gl === null) {
		alert("Unable to initialize WebGL. Looks like your browser does not support it!");
		return;
	}

	const shaderProgram = initShaderProgram(gl, VERTEX_SHADER_SRC, FRAG_SHADER_SRC);
	if (shaderProgram == null) {
		alert("Unable to load shaders!");
		return;
	}

	{
		const buffer = initBuffer(gl)!;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		const posAttrib = gl.getAttribLocation(shaderProgram, 'aPos');
		gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(posAttrib);
	}

	gl.useProgram(shaderProgram);
	{
		const resUniform = gl.getUniformLocation(shaderProgram, 'uResolution');
		gl.uniform2f(resUniform, canvas.width, canvas.height);
	}

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

const VERTEX_SHADER_SRC = `
attribute vec4 aPos;

void main() {
	gl_Position = aPos;
}`;

const FRAG_SHADER_SRC = `
uniform lowp vec2 uResolution;

void main() {
	gl_FragColor = vec4(gl_FragCoord.xy / uResolution, 0, 1);
}`;

const SCREEN_QUAD_POSITIONS = new Float32Array([
	 1,  1,
	-1,  1,
	 1, -1,
	-1, -1,
]);

function loadShader(gl: WebGLRenderingContext, type: GLenum, source: string) {
	const shader = gl.createShader(type);
	if (shader == null) {
		return undefined;
	}
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		if (log != null) {
			console.error(`Failed to load ${type == gl.FRAGMENT_SHADER ? 'frag' : 'vtx'} shader:\n` + log);
		}
		gl.deleteShader(shader);
		return undefined;
	}

	return shader;
}

function initShaderProgram(gl: WebGLRenderingContext, vtxSrc: string, fragSrc: string) {
	const vtxShader = loadShader(gl, gl.VERTEX_SHADER, vtxSrc);
	const fragShader = loadShader(gl, gl.FRAGMENT_SHADER, fragSrc);
	const shaderProgram = gl.createProgram();

	if (vtxShader == null || fragShader == null || shaderProgram == null) {
		return undefined;
	}

	gl.attachShader(shaderProgram, vtxShader);
	gl.attachShader(shaderProgram, fragShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		return undefined;
	}

	return shaderProgram;
}

function initBuffer(gl: WebGLRenderingContext) {
	const buffer = gl.createBuffer();

	if (buffer == null) {
		return undefined;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, SCREEN_QUAD_POSITIONS, gl.STATIC_DRAW);

	return buffer;
}

function bindBuffer(gl: WebGLRenderingContext, buffer: WebGLBuffer) {
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

}

window.onload = main;
