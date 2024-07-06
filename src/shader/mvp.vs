#version 300 es

uniform mat4 uMVP;

in vec4 iPos;

void main() {
    gl_Position = uMVP * iPos;
}
