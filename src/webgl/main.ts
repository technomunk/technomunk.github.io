// let vertexShader = fetch('shaders/identity.vs');

import { setupScreenRenderer } from "./frag_renderer";

function main() {
	let canvas = document.getElementById('canvas') as HTMLCanvasElement;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	let gl = canvas.getContext('webgl', { alpha: false, });
	
	if (gl === null) {
		alert("Unable to initialize WebGL. Looks like your browser does not support it!");
		return;
	}

	const shader = setupScreenRenderer(gl, FRAG_SHADER_SRC);

	if (shader == null) {
		// alert("Failed to compile shaders!");
		return;
	}

	gl.useProgram(shader);

	const uniformLocations = {
		res: gl.getUniformLocation(shader, 'uRes'),
		rect: gl.getUniformLocation(shader, 'uRect'),
		limit: gl.getUniformLocation(shader, 'uLimit'),
		limitColor: gl.getUniformLocation(shader, 'uLimitColor'),
	}
	const widthToHeight = canvas.width / canvas.height;

	gl.uniform2f(uniformLocations.res, canvas.width, canvas.height);
	gl.uniform4f(uniformLocations.rect, -1*widthToHeight, -1, 2*widthToHeight, 2);
	gl.uniform1i(uniformLocations.limit, 32);
	gl.uniform4f(uniformLocations.limitColor, 0, 0, 0, 0);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

const FRAG_SHADER_SRC = `
const int MAX_LOOP = 4096;
uniform lowp vec2 uRes;

uniform highp vec4 uRect;
uniform int uLimit;
uniform lowp vec4 uLimitColor;

highp vec2 csqr(in vec2 z) {
	return vec2(z.x*z.x - z.y*z.y, 2.*z.x*z.y);
}

int mandel(in vec2 c) {
	highp vec2 z = vec2(0);
	for (int i = 0; i < MAX_LOOP; ++i) {
		z = csqr(z) + c;
		if (i >= uLimit || dot(z, z) >= 4.) {
			return i;
		}
	}
	return uLimit;
}

void main() {
	highp vec2 coord = uRect.xy + uRect.zw * (gl_FragCoord.xy / uRes);
	int val = mandel(coord);
	if (val == uLimit) {
		gl_FragColor = uLimitColor;
	} else {
		lowp float fval = float(val)/float(uLimit);
		gl_FragColor = vec4(fval, fval, fval, 1);
	}
}
`;

window.onload = main;
