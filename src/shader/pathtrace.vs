#version 300 es

precision highp float;
precision highp int;

layout(std140) uniform;
uniform vec2 uResolution;
uniform float uCamFov;
uniform mat3 uView;
uniform int uFrameIndex;

out vec2 vUV;
out vec3 vRayDir;

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

vec2 randVec2(inout uint state) {
    return vec2(rand(state), rand(state));
}

vec3 rayDir(vec2 xy, inout uint rngState) {
    float ratio = uResolution.x / uResolution.y;
    float angle = tan(uCamFov * 0.5);
    vec2 offset = (1. - randVec2(rngState) * 2.) / uResolution;
    return uView * vec3((xy + offset) * vec2(angle * ratio, angle), 1);
}

void main() {
    uint rngState = uint(gl_VertexID) * uint(1973) + uint(uFrameIndex) * uint(9277);
    float u = float(gl_VertexID & 1);
    float v = float((gl_VertexID >> 1) & 1);

    vUV = vec2(u, v);
    gl_Position = vec4(vUV * 2. - 1., 0, 1);
    vRayDir = rayDir(gl_Position.xy, rngState);
}
