// let vertexShader = fetch('shaders/identity.vs');

import { GestureDecoder, DragEvent as DragGest, ZoomEvent as ZoomGest } from "../lib/gesture";
import { compileProgram, setupFullviewQuad } from "../lib/glutil";
import SideMenu from "../lib/side_menu";

const WHEEL_SENSITIVITY = -1e-3;

function setupMandelbrot(vertex: string, fragment: string) {
	let canvas = document.getElementById('canvas') as HTMLCanvasElement;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const gl = canvas.getContext('webgl')!;
	const program = compileProgram(gl, vertex, fragment);
	setupFullviewQuad(gl, program, 'aPos');

	const widthToHeight = canvas.width / canvas.height;
	gl.useProgram(program);
	const uPosLoc = gl.getUniformLocation(program, 'uPos');
	gl.uniform2f(uPosLoc, 0, 0);
	const uDimLoc = gl.getUniformLocation(program, 'uDims');
	gl.uniform2f(uDimLoc, widthToHeight, 1);
	const uLimLoc = gl.getUniformLocation(program, 'uLim');
	gl.uniform1i(uLimLoc, 32);
	const uInsideColor = gl.getUniformLocation(program, 'uInsideColor');
	gl.uniform4f(uInsideColor, 0, 0, 0, 1);
	
	const draw = ()=>{
		gl.clearColor(0, 0, 0, 1);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	};

	requestAnimationFrame(draw);
}

Promise.all([
	fetch('shaders/mandel.vs').then(response => response.text()),
	fetch('shaders/mandel.fs').then(response => response.text()),
]).then(
	([vertex, fragment]) => setupMandelbrot(vertex, fragment));

window.onload = () => {
	const menu = new SideMenu(document.getElementById('side-menu')!, document.getElementById('toggle-menu')!);
};
