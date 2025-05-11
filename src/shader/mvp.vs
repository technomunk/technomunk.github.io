#version 300 es

in vec3 aPos;
in vec3 aNorm;

uniform mat4 uModel;
uniform mat4 uVP;

out vec3 vNormal;

vec3 swap_axes(in vec3 v) {
    return vec3(v.x, v.z, -v.y);
}

void main() {
    vNormal = mat3(uModel) * swap_axes(aNorm); // Transform normal to world space
    gl_Position = uVP * uModel * vec4(swap_axes(aPos), 1.0);
}
