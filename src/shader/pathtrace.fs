#version 300 es

precision highp float;
layout(std140) uniform;

uniform vec2 uResolution;
uniform vec3 uCamPos;
uniform float uCamFov;
uniform mat3 uView;
uniform samplerCube uSkybox;

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
};

const vec4 SPHERE = vec4(0, 0, 0, .5);


// Copied from https://github.com/hughsk/glsl-hsv2rgb/blob/master/index.glsl
// Which in tern was sourced from http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 rayDir(in vec2 uv) {
    float ratio = uResolution.x / uResolution.y;
    float angle = tan(uCamFov * .5);
    return uView * normalize(vec3(uv * vec2(angle * ratio, angle), 1));
}

vec3 debugDir(in vec3 dir) {
    return (dir + vec3(1)) * .5;
}

bool intersectRaySphere(inout RayHit hit, in Ray ray, in vec4 sphere) {
    // https://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
	vec3 nOrigin = ray.pos - sphere.xyz;
	float b = 2.0 * dot(ray.dir, nOrigin);
	float c = dot(nOrigin, nOrigin) - sphere.w * sphere.w;

	float discr = b * b - 4.0 * c;

	if (discr > 0.0) {
		float hitDist = (-b - sqrt(discr)) * 0.5;
		if (hitDist < hit.dist && hitDist > c_MIN_DIST) {
			hit.dist = hitDist;
			hit.point = ray.pos + ray.dir * hitDist;
			hit.normal = normalize(hit.point - sphere.xyz);
			return true;
		}
	}

	return false;
}


void main() {
    Ray ray = Ray(uCamPos, rayDir(gl_FragCoord.xy / uResolution * 2. - 1.));
    RayHit hit;
    hit.dist = c_MAX_DIST;

    if (intersectRaySphere(hit, ray, SPHERE)) {
        oColor = texture(uSkybox, reflect(ray.dir, hit.normal)) * vec4(2);
    } else {
        oColor = texture(uSkybox, ray.dir) * vec4(2);
    }
}
