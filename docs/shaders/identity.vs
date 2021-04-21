attribute vec2 aPos;

void main() {
	vPos = aPos;
	gl_Position = vec4(aPos, 0, 1);
}
