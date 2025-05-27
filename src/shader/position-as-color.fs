#version 300 es

uniform mediump vec2 uCanvasSize;

out lowp vec4 oColor;

void main() {
    oColor = vec4(gl_FragCoord.xy / uCanvasSize, gl_FragDepth, 1);
}
