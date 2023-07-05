vec3 slerp(vec3 a, vec3 b, float t) {
    float p = dot(a, b);
    if((p > c_ALMOST_ONE) || (p < -c_ALMOST_ONE)) {
        if(t < 0.5) {
            return a;
        }
        return b;
    }

    float theta = acos(p);
    return (a * sin((1.0 - t) * theta) + b * sin((t * theta))) / sin(theta);
}

vec3 toSRGB(vec3 linear) {
	bvec3 cutoff = lessThan(linear, vec3(0.0031308));
	vec3 higher = vec3(1.055) * pow(linear, vec3(1.0 / 2.4)) - vec3(0.055);
	vec3 lower = linear * vec3(12.92);
	return mix(higher, lower, cutoff);
}

vec3 fromSRGB(vec3 srgb) {
	bvec3 cutoff = lessThan(srgb, vec3(0.04045));
	vec3 higher = pow((srgb + vec3(0.055)) / vec3(1.055), vec3(2.4));
	vec3 lower = srgb / vec3(12.92);

	return mix(higher, lower, cutoff);
}

#pragma glslify: export(slerp)
#pragma glslify: export(toSRGB)
#pragma glslify: export(fromSRGB)
