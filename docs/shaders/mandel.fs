#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

const int MAX_LOOP_COUNT = 4096;

varying vec2 vPos;

uniform int uLim;
uniform lowp vec4 uInsideColor;

const float SIXTH = 1. / 6.;

// Copied from https://github.com/hughsk/glsl-hsv2rgb/blob/master/index.glsl
// Which in tern was sourced from http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

int mandel(in float re, in float im) {
	float x = re;
	float y = im;
	float tmp;
	for (int i = 0; i < MAX_LOOP_COUNT; ++i) {
		if (i >= uLim || x*x+y*y >= 4.) {
			return i;
		}

		tmp = x;
		x = x*x - y*y + re;
		y = 2.*tmp*y + im;
	}
	return uLim;
}

void main() {
	int val = mandel(vPos.x, vPos.y);
	if (val == uLim) {
		gl_FragColor = uInsideColor;
	} else {
		vec3 hsv = vec3(float(val) / float(uLim), 1, 1);
		gl_FragColor = vec4(hsv2rgb(hsv), 1);
	}
}
