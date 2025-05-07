const canv = document.createElement('canvas');
const gl = canv.getContext('webgl2');

const shader = new Shader(gl, { vertex, fragment });
const mesh = new Mesh(gl, {
	attributes: {
		aPos: {
			values: new Float32Array([]),
			size: 3,
		},
		iNorm: {
			values: new Float32Array([]),
			size: 3,
		},
	},
	indices: new Uint16Array([]),
});

shader.setUniforms({ uView: [], uProj: [] });
// shader.draw(entity);
shader.setUniforms(entity.uniforms);
shader.setAttributes(entity.attributes);
shader.draw(entity.indices);
