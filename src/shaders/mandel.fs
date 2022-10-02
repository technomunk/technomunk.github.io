#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

const int MAX_LOOP_COUNT = 256;

varying vec2 vPos;

uniform int uLim;

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
		gl_FragColor = vec4(1);
	} else {
		float v = 1. - float(val) / float(uLim);
		gl_FragColor = vec4(vec3(v), 1);
	}
}
