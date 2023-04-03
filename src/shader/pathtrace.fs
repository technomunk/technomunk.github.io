#version 300 es

#define MAX_DIST 1e999
#define DATA_SIZE 4

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
layout(std140) uniform;

struct Sphere {
	vec4 pos; // includes radius at w
	vec4 color;
};

uniform vec2 uResolution;
uniform float uCamFov;
uniform lowp vec3 uLightColor;
uniform vec3 uLightDir;
uniform int uSphereCount;

uniform Data {
	vec4 uData[DATA_SIZE];
};

out lowp vec4 oColor;

struct Ray {
	vec3 origin;
	vec3 dir;
};

struct RayHit {
	float dist;
	vec3 normal;
};

const vec3 c_RayOrigin = vec3(0, 0, 0);

Ray ray() {
	float fx = tan(uCamFov * 0.5) / uResolution.x;
	vec2 d = fx * (gl_FragCoord.xy * 2.0 - uResolution);

	return Ray(c_RayOrigin, normalize(vec3(d, 1)));
}

RayHit intersectRaySphere(Ray ray, Sphere sphere) {
	// https://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
	vec3 nOrigin = ray.origin - sphere.pos.xyz;
	float b = 2.0 * dot(ray.dir, nOrigin);
	float c = dot(nOrigin, nOrigin) - sphere.pos.w*sphere.pos.w;

	float discr = b*b - 4.0*c;

	if (discr > 0.0) {
		float hitDist = (-b - sqrt(discr))*0.5;
		vec3 hitPt = ray.origin + ray.dir * hitDist;
		return RayHit(hitDist, normalize(hitPt - sphere.pos.xyz));
	}

	return RayHit(-1.0, vec3(0));
}

void raycast(Ray ray) {
	float minDist = MAX_DIST;
	for (int i = 0; i < uSphereCount; ++i) {
		Sphere sphere = Sphere(uData[i * 2], uData[i * 2 + 1]);
		RayHit hit = intersectRaySphere(ray, sphere);
		if (hit.dist > 0.0 && hit.dist < minDist) {
			minDist = hit.dist;
			oColor = vec4(uLightColor * sphere.color.xyz * -dot(uLightDir, hit.normal), 1);
		}
	}
}

void main() {
	raycast(ray());
}
