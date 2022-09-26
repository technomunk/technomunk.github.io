#version 300 es

// #pragma optionNV(fastmath off)
// #pragma optionNV(fastprecision off)

const int MAX_LOOP = 4096;

uniform lowp vec2 uRes;

uniform highp vec4 uPos;
uniform highp vec4 uDim;
uniform int uLimit;
uniform lowp vec4 uLimitColor;

out lowp vec4 oColor;

highp vec2 ed_add(in vec2 eda, in vec2 edb) {
	highp vec2 edc;
	highp float t1, t2, e;

	t1 = eda.x + edb.x;
	e = t1 - eda.x;
	t2 = ((edb.x - e) + (eda.x - (t1 - e))) + eda.y + edb.y;

	edc.x = t1 + t2;
	edc.y = t2 - (edc.x - t1);

	return edc;
}

highp vec2 ed_sub(in vec2 eda, in vec2 edb) {
	highp vec2 edc;
	highp float t1, t2, e;

	t1 = eda.x - edb.x;
	e = t1 - eda.x;
	t2 = ((-edb.x - e) + (eda.x - (t1 - e))) + eda.y - edb.y;

	edc.x = t1 + t2;
	edc.y = t2 - (edc.x - t1);
	return edc;
}

highp vec2 ed_mul(in vec2 eda, in vec2 edb) {
	const highp float SPLIT = 8193.;

	highp vec2 edc;

	highp float c11, c21, c2, e, t1, t2;
	highp float a1, a2, b1, b2, cona, conb;

	cona = eda.x * SPLIT;
	conb = edb.x * SPLIT;

	a1 = cona - (cona - eda.x);
	b1 = conb - (conb - edb.x);
	a2 = eda.x - a1;
	b2 = edb.x - b1;

	c11 = eda.x * edb.x;
	c21 = a2 * b2 + (a2 * b1 + (a1 * b2 + (a1 * b1 - c11)));

	c2 = eda.x * edb.y + eda.y * edb.x;

	t1 = c11 + c2;
	e = t1 - c11;
	t2 = eda.y * edb.y + ((c2 - e) + (c11 - (t1 - e))) + c21;

	edc.x = t1 + t2;
	edc.y = t2 - (edc.x - t1);

	return edc;
}

int mandel(in vec2 re, in vec2 im) {
	highp vec2 x = re;
	highp vec2 y = im;
	highp vec2 tmp;
	for (int i = 0; i < MAX_LOOP; ++i) {
		tmp = x;
		x = ed_add(ed_sub(ed_mul(x, x), ed_mul(y, y)), re);
		y = ed_add(ed_mul(vec2(2, 0), ed_mul(tmp, y)), im);

		if (i >= uLimit || ed_add(ed_mul(x, x), ed_mul(y, y)).x >= 4.) {
			return i;
		}
	}
	return uLimit;
}

void main() {
	highp vec2 rx = ed_mul(uDim.xy, vec2(gl_FragCoord.x / uRes.x, 0));
	highp vec2 x = ed_add(uPos.xy, rx);
	highp vec2 y = ed_add(uPos.zw, ed_mul(uDim.zw, vec2(gl_FragCoord.y / uRes.y, 0)));
	int val = mandel(x, y);
	if (val == uLimit) {
		oColor = uLimitColor;
	} else {
		lowp float fval = float(val) / float(uLimit);
		oColor = vec4(abs(x.x), abs(x.y)*1e8, y.x*30., 1);
		if (rx.y == 0.) {
			oColor = vec4(1, 1, 0, 1);
		}
		// gl_FragColor = mix(vec4(0), vec4(gl_FragCoord.xy / uRes, 0, 1), float(val)/float(uLimit));
	}
}
