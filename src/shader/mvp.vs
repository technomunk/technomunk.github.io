#version 300 es

in vec3 aPos;
in vec3 aNorm;

uniform mat4 uModel;
uniform mat4 uVP;

out vec3 vNormal;

void main() {
    vNormal = mat3(uModel) * aNorm; // Transform normal to world space
    gl_Position = uVP * uModel * vec4(aPos, 1.0);
}
