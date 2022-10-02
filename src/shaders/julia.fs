#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

const int MAX_LOOP_COUNT = 1024;
const float HUE_OFFSET = .65;

varying vec2 vPos;

uniform int uLim;
uniform float uEscapeD;
uniform lowp vec4 uInsideColor;
uniform vec2 uSeed;

const float SIXTH = 1. / 6.;

// Copied from https://github.com/hughsk/glsl-hsv2rgb/blob/master/index.glsl
// Which in tern was sourced from http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec2 complex_mul(in vec2 a, in vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 complex_sum(in vec2 a, in vec2 b) {
    return a + b;
}

float mag2(in vec2 v) {
    return v.x*v.x + v.y*v.y;
}

int julia(in vec2 pt) {
    for (int i = 0; i < MAX_LOOP_COUNT; ++i) {
        if (i >= uLim || mag2(pt) >= uEscapeD) {
            return i;
        }

        pt = complex_mul(pt, pt) + uSeed;
    }
}

void main() {
	int val = julia(vPos.xy);
	if (val == uLim) {
		gl_FragColor = uInsideColor;
	} else {
        float v = float(val) / float(uLim);
        float h = v + HUE_OFFSET;
        if (h > 1.0) {
            h = h - 1.0;
        }
		vec3 hsv = vec3(h, 1, .7 + v*.3);
		gl_FragColor = vec4(hsv2rgb(hsv), 1);
	}
}
