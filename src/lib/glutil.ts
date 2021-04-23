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
) {
	const shader = gl.createShader(type);
	if (shader == null) {
		throw new Error(`Failed to create a shader of type: ${type}`);
	}

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if ( ! gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const message = "Failed to compile shader:\n" + gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(message);
	}

	return shader;
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
) {
	const program = gl.createProgram();
	if (program == null) {
		throw new Error("Failed to create a GL program");
	}

	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	if ( ! vertexShader) {
		gl.deleteProgram(program);
		throw new Error("Failed to create vertex shader!");
	}

	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	if ( ! fragmentShader) {
		gl.deleteProgram(program);
		gl.deleteShader(vertexShader);
		throw new Error("Failed to create fragment shader!");
	}

	gl.shaderSource(vertexShader, vertexSource);
	gl.shaderSource(fragmentShader, fragmentSource);
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);

	gl.compileShader(vertexShader);
	gl.compileShader(fragmentShader);

	gl.linkProgram(program);
	
	if ( ! gl.getProgramParameter(program, gl.LINK_STATUS)) {
		let message = "Failed to link shader program:";
		const programInfo = gl.getProgramInfoLog(program);
		if (programInfo) {
			message += '\n' + programInfo;
		}
		const vertexShaderInfo = gl.getShaderInfoLog(vertexShader);
		if (vertexShaderInfo) {
			message += "Vertex shader log:\n" + vertexShaderInfo;
		}
		const fragmentShaderInfo = gl.getShaderInfoLog(fragmentShader);
		if (fragmentShaderInfo) {
			message += "Fragment shader log:\n" + fragmentShaderInfo;
		}

		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		gl.deleteProgram(program);
		
		throw new Error(message);
	}

	// Once the program is linked the shaders are no longer needed, free the resources.
	gl.deleteShader(vertexShader);
	gl.deleteShader(fragmentShader);

	return program;
}

/** Setup a buffer of 4 vertices that is a quad that takes up full view.
 * @param gl The rendering context that will be used to draw the quad.
 * @param program The shader program used to draw the quad.
 * @param attribute The position or the name of the vertex position attribute.
 * @returns Successfully created and filled buffer.
 * @throws Errors if the buffer was not allocated or the attribute was not found.
 */
export function setupFullviewQuad(
	gl: WebGLRenderingContext,
	program: WebGLProgram,
	attribute: GLint | string
) {
	// Get attribute location
	let attributeLoc: GLint;
	if (typeof attribute === typeof 'number') {
		attributeLoc = attribute as GLint;
	} else {
		attributeLoc = gl.getAttribLocation(program, attribute as string);
	}

	if (attributeLoc == -1) {
		throw new Error(`Attribute ${attribute} was not found in the provided program.`);
	}

	// Allocate and populate the vertex buffer.
	const buffer = gl.createBuffer();
	if (buffer == null) {
		throw new Error("Failed to create a buffer.");
	}
	const data = new Float32Array([
		-1, -1,
		-1,  1,
		 1, -1,
		 1,  1,
	]);

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attributeLoc);

	return buffer;
}
