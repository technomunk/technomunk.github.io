#version 300 es

precision highp float;

layout(std140) uniform;
uniform vec2 uResolution;
uniform float uCamFov;
uniform mat3 uView;

out vec2 vUV;
out vec3 vRayDir;

vec3 rayDir(vec2 xy) {
    float ratio = uResolution.x / uResolution.y;
	float angle = tan(uCamFov * 0.5);
	return uView * vec3(xy * vec2(angle * ratio, angle), 1);
}

void main() {
    float u = float(gl_VertexID & 1);
    float v = float((gl_VertexID >> 1) & 1);

    vUV = vec2(u, v);
    gl_Position = vec4(vUV * 2. - 1., 0, 1);
    vRayDir = rayDir(gl_Position.xy);
}
