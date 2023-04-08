#version 300 es

#define DATA_SIZE 12*128

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
layout(std140) uniform;

struct Material {
	vec4 albedo; // w is how smooth it is
	vec4 emissive;
};

struct Sphere {
	vec4 pos; // includes radius at w
	Material material;
};

uniform vec2 uResolution;
uniform vec3 uCamPos;
uniform mat3 uView;
uniform float uCamFov;
uniform lowp vec3 uLightColor;
uniform vec3 uLightDir;
uniform int uSphereCount;
uniform int uBounces;
uniform int uFrameIndex;
uniform sampler2D uLastFrame;

uniform Data {
	vec4 uData[DATA_SIZE];
};

out lowp vec4 oColor;

const float c_PI = 3.14159265359;
const float c_PI2 = 2.0 * c_PI;
const float c_MAX_DIST = 1e9999;
const float c_NUDGE = 1e-6;
const float c_ALMOST_ONE = 0.99999;

struct Ray {
	vec3 pos;
	vec3 dir;
};

struct RayHit {
	float dist;
	vec3 point;
	vec3 normal;
	Material material;
};

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

uint wangHash(inout uint seed) {
	// shamelessly stolen from https://www.shadertoy.com/view/tsBBWW
	seed = uint(seed ^ uint(61)) ^ uint(seed >> uint(16));
	seed *= uint(9);
	seed = seed ^ (seed >> 4);
	seed *= uint(0x27d4eb2d);
	seed = seed ^ (seed >> 15);
	return seed;
}

float randomFloat(inout uint state) {
	return float(wangHash(state)) / 4294967296.0;
}

vec3 randomDir(inout uint state) {
	float z = randomFloat(state) * 2.0 - 1.0;
	float a = randomFloat(state) * c_PI2;
	float r = sqrt(1.0 - z * z);
	float x = r * cos(a);
	float y = r * sin(a);
	return vec3(x, y, z);
}

vec3 randomBounce(in vec3 normal, inout uint rngState) {
	vec3 dir = randomDir(rngState);
	return dir * sign(dot(normal, dir));
}

Ray ray() {
	float pixelAngle = tan(uCamFov * 0.5) / uResolution.x;
	vec2 xy = pixelAngle * ((gl_FragCoord.xy * 2.0 - uResolution));

	vec3 dir = uView * normalize(vec3(xy, 1));

	return Ray(uCamPos, dir);
}

bool intersectRaySphere(in Ray ray, Sphere sphere, inout RayHit hit) {
	// https://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
	vec3 nOrigin = ray.pos - sphere.pos.xyz;
	float b = 2.0 * dot(ray.dir, nOrigin);
	float c = dot(nOrigin, nOrigin) - sphere.pos.w * sphere.pos.w;

	float discr = b * b - 4.0 * c;

	if(discr > 0.0) {
		float hitDist = (-b - sqrt(discr)) * 0.5;
		if(hitDist < hit.dist && hitDist > c_NUDGE) {
			hit.dist = hitDist;
			hit.point = ray.pos + ray.dir * hitDist;
			hit.normal = normalize(hit.point - sphere.pos.xyz);
			hit.material = sphere.material;
			return true;
		}
	}

	return false;
}

RayHit intersectScene(in Ray ray) {
	RayHit hit;
	hit.dist = c_MAX_DIST;

	for(int i = 0; i < uSphereCount; ++i) {
		Sphere sphere = Sphere(uData[i * 3], Material(uData[i * 3 + 1], uData[i * 3 + 2]));
		intersectRaySphere(ray, sphere, hit);
	}

	return hit;
}

vec3 trace(in Ray ray, inout uint rngState) {
	vec3 light = vec3(0);
	vec3 color = vec3(1);

	for(int i = 0; i <= uBounces; ++i) {
		RayHit hit = intersectScene(ray);
		if(hit.dist == c_MAX_DIST) {
			// if(i > 0)
			light += uLightColor * color * -dot(ray.dir, uLightDir);
			break;
		}

		ray.pos = hit.point;
		ray.dir = normalize(mix(randomBounce(hit.normal, rngState), reflect(ray.dir, hit.normal), hit.material.albedo.w));

		light += hit.material.emissive.xyz * color;
		color *= hit.material.albedo.xyz;
	}
	return light;
}

void main() {
	uint rngState = uint(uint(gl_FragCoord.x) * uint(1973) + uint(gl_FragCoord.y) * uint(9277)) + uint(uFrameIndex) * uint(26699) | uint(1);
	Ray ray = ray();
	vec3 color = trace(ray, rngState);

	if(uFrameIndex > 0) {
		vec3 lastFrameColor = texture(uLastFrame, gl_FragCoord.xy / uResolution).rgb;
		color = mix(lastFrameColor, color, 1.0 / float(uFrameIndex + 1));
	}
	oColor = vec4(color, 1);
}
