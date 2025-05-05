import type { AttributeDataSet } from './attrib';

/** Collection of geometric data ready to be uploaded to the GPU for rendering */
export class Mesh<A extends AttributeDataSet = AttributeDataSet> {
	constructor(
		public attributes: A,
		public indices?: Uint16Array | Uint32Array,
	) {
		// validate that the vertex count is the same for all attributes
		let vertexCount: number | undefined;
		for (const [_, { size, values }] of Object.entries(attributes)) {
			if (vertexCount === undefined) {
				vertexCount = values.length / size;
			} else if (values.length / size !== vertexCount) {
				throw new Error('Vertex count mismatch in attributes');
			}
		}
	}
}
