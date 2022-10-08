// Functions emulating double precision by storing 2 single precision floats

// Heavily inspired by https://blog.cyclemap.link/2011-06-09-glsl-part2-emu/

vec2 ed_add(in vec2 eda, in vec2 edb) {
	vec2 edc;
	float t1, t2, e;

	t1 = eda.x + edb.x;
	e = t1 - eda.x;
	t2 = ((edb.x - e) + (eda.x - (t1 - e))) + eda.y + edb.y;

	edc.x = t1 + t2;
	edc.y = t2 - (edc.x - t1);

	return edc;
}

vec2 ed_sub(in vec2 eda, in vec2 edb) {
	vec2 edc;
	float t1, t2, e;

	t1 = eda.x - edb.x;
	e = t1 - eda.x;
	t2 = ((-edb.x - e) + (eda.x - (t1 - e))) + eda.y - edb.y;

	edc.x = t1 + t2;
	edc.y = t2 - (edc.x - t1);
	return edc;
}

vec2 ed_mul(in vec2 eda, in vec2 edb) {
	const float SPLIT = 8193.;

	vec2 edc;

	float c11, c21, c2, e, t1, t2;
	float a1, a2, b1, b2, cona, conb;

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

vec2 ed_len2(in vec4 ed) {
	return ed_add(ed_mul(ed.xy, ed.xy), ed_mul(ed.zw, ed.zw));
}

bool ed_ge(in vec2 eda, in vec2 edb) {
	return eda.x > edb.x || (eda.x == edb.x && eda.y >= edb.y);
}
