#version 300 es

void main() {
    float x = float(gl_VertexID & 1) * 4. - 1.;
    float y = float((gl_VertexID >> 1) & 1) * 4. - 1.;
    gl_Position = vec4(x, y, 0, 1);
}
