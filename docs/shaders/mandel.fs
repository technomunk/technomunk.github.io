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
