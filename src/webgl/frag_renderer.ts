/** Setup a full view render that uses the provided fragment shader.
 * @param gl The context to setup for rendering.
 * @param frag The fragment shader source to use.
 */
export function setupScreenRenderer(gl: WebGLRenderingContext, frag: string) {
	const shader = initShaderProgram(gl, frag);
	if (shader == null) {
		return undefined;
	}

	initQuad(gl, shader);

	return shader;
}

/** Compile and link shader program using provided fragment shader.
 * @param gl The context to use to create the shader program.
 * @param frag The fragment shader source to use.
 * @returns The initialized program if successful or undefined otherwise.
 */
function initShaderProgram(gl: WebGLRenderingContext, frag: string) {
	// Compile vertex shader
	const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
	gl.shaderSource(vertexShader, VERTEX_SHADER_SRC);
	gl.compileShader(vertexShader);

	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error("Failed to compile vertex shader:\n"
			+ gl.getShaderInfoLog(vertexShader));
		gl.deleteShader(vertexShader);
		return undefined;
	}

	// Compile fragment shader
	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
	gl.shaderSource(fragmentShader, frag);
	gl.compileShader(fragmentShader);

	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error("Failed to compile fragment shader:\n"
			+ gl.getShaderInfoLog(fragmentShader));
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		return undefined;
	}

	// Link the shader program
	const shaderProgram = gl.createProgram()!;

	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.error("Failed to link shader program:\n"
			+ gl.getProgramInfoLog(shaderProgram));
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		gl.deleteProgram(shaderProgram);
		return undefined;
	}

	gl.deleteShader(vertexShader);
	gl.deleteShader(fragmentShader);
	return shaderProgram;
}

/** Initialize the viewport quad.
 *
 * Creates and binds position buffer.
 * @param gl The context to use while setting up the buffer.
 * @param program The program that will be used to render the quad.
 */
function initQuad(gl: WebGLRenderingContext, program: WebGLProgram) {
	const buffer = gl.createBuffer()!;
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, SCREEN_QUAD_POSITIONS, gl.STATIC_DRAW);
	const attrib = gl.getAttribLocation(program, ATTRIB_NAME_VERTEX_POSITION);
	gl.vertexAttribPointer(attrib, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attrib);	
}

export const ATTRIB_NAME_VERTEX_POSITION = 'aPos';
const VERTEX_SHADER_SRC = `attribute lowp vec2 ${ATTRIB_NAME_VERTEX_POSITION};void main(){gl_Position=vec4(${ATTRIB_NAME_VERTEX_POSITION},0,1);}`;
const SCREEN_QUAD_POSITIONS = new Float32Array([ 1, 1, -1, 1, 1, -1, -1, -1, ]);
