#version 300 es

#define DATA_SIZE 12*128

precision highp float;
precision highp int;
layout(std140) uniform;

struct Material {
	vec4 albedo; // w is how smooth it is
	vec4 emissive;
};

struct Sphere {
	vec4 pos; // includes radius at w
	Material material;
};

uniform vec3 uCamPos;
uniform vec3 uLightColor;
uniform vec3 uLightDir;
uniform vec3 uAmbientColor;
uniform int uSphereCount;
uniform int uBounces;
uniform int uFrameIndex;
uniform sampler2D uLastFrame;
uniform samplerCube uSkybox;

in vec2 vUV;
in vec3 vRayDir;

uniform Data {
	vec4 uData[DATA_SIZE];
};

out lowp vec4 oColor;

const float c_PI = 3.14159265359;
const float c_PI2 = 2.0 * c_PI;
const float c_MAX_DIST = 1e9999;
const float c_MIN_DIST = 0.;
const int c_RAYS_PER_PIXEL = 4;

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

uint wangHash(inout uint seed) {
	// shamelessly stolen from https://www.shadertoy.com/view/tsBBWW
	seed = uint(seed ^ uint(61)) ^ uint(seed >> uint(16));
	seed *= uint(9);
	seed = seed ^ (seed >> 4);
	seed *= uint(0x27d4eb2d);
	seed = seed ^ (seed >> 15);
	return seed;
}

float rand(inout uint state) {
	return float(wangHash(state)) / 4294967296.0;
}

vec3 randomDir(inout uint state) {
	float z = rand(state) * 2.0 - 1.0;
	float a = rand(state) * c_PI2;
	float r = sqrt(1.0 - z * z);
	float x = r * cos(a);
	float y = r * sin(a);
	return vec3(x, y, z);
}

vec3 randomBounce(in vec3 normal, inout uint rngState) {
	vec3 dir = randomDir(rngState);
	return dir * sign(dot(normal, dir));
}

bool intersectRaySphere(in Ray ray, Sphere sphere, inout RayHit hit) {
	// https://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
	vec3 nOrigin = ray.pos - sphere.pos.xyz;
	float b = 2.0 * dot(ray.dir, nOrigin);
	float c = dot(nOrigin, nOrigin) - sphere.pos.w * sphere.pos.w;

	float discr = b * b - 4.0 * c;

	if(discr > 0.0) {
		float hitDist = (-b - sqrt(discr)) * 0.5;
		if(hitDist < hit.dist && hitDist > c_MIN_DIST) {
			hit.dist = hitDist;
			hit.point = ray.pos + ray.dir * hitDist;
			hit.normal = normalize(hit.point - sphere.pos.xyz);
			hit.material = sphere.material;
			return true;
		}
	}

	return false;
}

bool intersectScene(in Ray ray, inout RayHit hit) {
	bool hitSomething = false;
	hit.dist = c_MAX_DIST;

	for(int i = 0; i < uSphereCount; ++i) {
		Sphere sphere = Sphere(uData[i * 3], Material(uData[i * 3 + 1], uData[i * 3 + 2]));
		hitSomething = intersectRaySphere(ray, sphere, hit) || hitSomething;
	}

	return hitSomething;
}

float spread(vec3 rayDir, vec3 normal) {
	return max(-(dot(rayDir, normal)), 0.);
}

vec3 trace(in Ray ray, inout uint rngState) {
	vec3 light = vec3(0);
	vec3 color = vec3(1);
	RayHit hit;

	for(int i = 0; i <= uBounces; ++i) {
		if(!intersectScene(ray, hit)) {
			light += color * texture(uSkybox, ray.dir).rgb;
			// light += uLightColor * color * spread(ray.dir, uLightDir);
			break;
		}

		light += hit.material.emissive.rgb * color * spread(ray.dir, hit.normal);
		color *= hit.material.albedo.rgb;

		ray.pos = hit.point;
		ray.dir = normalize(mix(randomBounce(hit.normal, rngState), reflect(ray.dir, hit.normal), hit.material.albedo.w));
	}
	return light  + uAmbientColor * color;
}

void main() {
	uint rngState = (uint(gl_FragCoord.x) * uint(1973) + uint(gl_FragCoord.y) * uint(9277) + uint(uFrameIndex) * uint(26699)) | uint(1);
	vec3 color = vec3(0);
	Ray ray;
	for (int i = 0; i < c_RAYS_PER_PIXEL; ++i) {
		ray = Ray(uCamPos, normalize(vRayDir));
		color += trace(ray, rngState) / float(c_RAYS_PER_PIXEL);
	}

	vec3 lastFrameColor = texture(uLastFrame, vUV).rgb;
	color = mix(lastFrameColor, color, 1. / float(uFrameIndex + 1));
	oColor = vec4(color, 1);
}
