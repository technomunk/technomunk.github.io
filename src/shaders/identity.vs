#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

attribute vec2 aPos;

uniform vec2 uPos;
uniform vec2 uDims;

varying vec2 vPos;

void main() {
	vPos = uPos + uDims * aPos;
	gl_Position = vec4(aPos, 0, 1);
}
