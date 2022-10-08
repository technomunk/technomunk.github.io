#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 vPos;

uniform lowp vec4 uColor;

void main() {
	gl_FragColor = uColor;
}
