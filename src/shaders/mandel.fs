#version 300 es

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

const int MAX_LOOP_COUNT = 256;

uniform vec2 uPos;
uniform vec2 uStep;
uniform int uLim;

out lowp vec4 oColor;

int mandel(in vec2 pt) {
	float re = pt.x;
	float im = pt.y;
	float sqX, sqY;
	for (int i = 0; i < MAX_LOOP_COUNT; ++i) {
		sqX = pt.x*pt.x;
		sqY = pt.y*pt.y;
		if (i >= uLim || sqX + sqY >= 4.) {
			return i;
		}

		pt = vec2(sqX - sqY + re, 2.*pt.x*pt.y + im);
	}
	return uLim;
}

void main() {
	vec2 pos = uPos + vec2(gl_FragCoord) * uStep;
	int val = mandel(pos);
	if (val == uLim) {
		oColor = vec4(1);
	} else {
		float v = 1. - float(val) / float(uLim);
		oColor = vec4(vec3(v), 1);
	}
}
