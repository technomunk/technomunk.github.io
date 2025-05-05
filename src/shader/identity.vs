#version 300 es

in vec2 aPos;
in vec4 aColor;

out vec4 vColor;

void main() {
    gl_Position = vec4(aPos, 0.0f, 1.0f);
    vColor = aColor;
}
