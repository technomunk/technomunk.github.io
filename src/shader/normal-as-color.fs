#version 300 es
precision mediump float;

in vec3 vNormal;
out lowp vec4 oColor;

void main() {
    // Normalize the normal vector to ensure it is in the range [0, 1]
    vec3 normalizedNormal = normalize(vNormal);

    // Map the normal vector components from [-1, 1] to [0, 1]
    oColor = vec4(normalizedNormal * 0.5f + 0.5f, 1.0f);
}
