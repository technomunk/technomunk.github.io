import type {
	Camera as GltfCamera,
	Primitive as GltfPrimitive,
	vec3,
	Node as GltfNode,
	Material as GltfMaterial,
} from '@gltf-transform/core';
import { WebIO } from '@gltf-transform/core';
import { Mesh } from './render/mesh';
import { entries } from './render/typeutil';
import { mat4 } from 'gl-matrix';

export const importGltfMesh = async <A extends string = string>(
	url: string,
	name: string,
	attributes: Record<A, string>,
): Promise<Mesh<A>> => {
	const io = new WebIO();
	const document = await io.read(url);

	const mesh = document
		.getRoot()
		.listMeshes()
		.find((m) => m.getName() === name);
	if (!mesh) throw new Error(`Mesh with name "${name}" not found in the GLTF document.`);

	const primitive = mesh.listPrimitives()[0];
	return extractMesh(primitive, attributes);
};

const extractMesh = <A extends string = string>(
	primitive: GltfPrimitive,
	attributes: Record<A, string>,
): Mesh<A> => {
	const result = new Mesh<A>([]);

	for (const [attrName, semantic] of entries(attributes)) {
		const attribute = primitive.getAttribute(semantic);
		if (!attribute)
			throw new Error(`Attribute "${attrName}" with semantic "${semantic}" not found in mesh.`);

		const values = attribute.getArray();
		if (!values) throw new Error(`Attribute "${attrName}" has no data.`);

		result.set(attrName, { values, stride: attribute.getElementSize() });
		const indices = primitive.getIndices()?.getArray();
		if (indices) {
			result.indices = indices as Uint32Array | Uint16Array;
		}
	}

	return result;
};

type Entity<A extends string, M extends string = string> = {
	modelMatrix: mat4;
	material: Record<M, number | number[]>;
	mesh: Mesh<A>;
};
type Scene<A extends string, M extends string> = {
	meshes: Mesh<A>[];
	camera: {
		position: vec3;
		viewProjection: mat4;
	};
	entities: Entity<A, M>[];
};

export type MaterialProperty = 'base' | 'roughness' | 'metallic';

export const importGltfScene = async <A extends string = string, M extends string = string>(
	url: string,
	attributes: Record<A, string>,
	materials: Record<M, MaterialProperty>,
): Promise<Scene<A, M>> => {
	const io = new WebIO();
	const document = await io.read(url);

	const scene = document.getRoot().getDefaultScene();
	if (!scene) throw new Error('No default scene found in the GLTF document.');

	const result: Scene<A, M> = {
		meshes: [],
		camera: {
			position: [0, 0, 0], // Will be filled later
			viewProjection: mat4.create(), // Will be filled later
		},
		entities: [],
	};
	scene.traverse((node) => {
		const mesh = node.getMesh();
		if (mesh) {
			// TODO: Handle multiple primitives and materials
			const primitive = mesh.listPrimitives()[0];
			const extractedMesh = extractMesh(primitive, attributes);
			result.meshes.push(extractedMesh);

			const material = primitive.getMaterial();
			if (!material) {
				throw new Error(`Material not found for mesh primitive in node "${node.getName()}".`);
			}
			result.entities.push({
				modelMatrix: node.getWorldMatrix(),
				material: decodeMaterial(material, materials),
				mesh: extractedMesh,
			});
		}
		const camera = node.getCamera();
		if (camera) {
			result.camera = {
				position: node.getTranslation(),
				viewProjection: decodeViewProjection(result.camera.viewProjection, node, camera),
			};
		}
	});

	return result;
};

const decodeViewProjection = (result: mat4, node: GltfNode, camera: GltfCamera): mat4 => {
	const viewMatrix = node.getWorldMatrix();
	const projectionMatrix = mat4.perspective(
		mat4.create(),
		camera.getYFov(),
		camera.getAspectRatio() ?? 1,
		camera.getZNear(),
		camera.getZFar(),
	);
	if (!projectionMatrix) throw new Error('Camera projection matrix not found.');

	return mat4.multiply(result, projectionMatrix, viewMatrix);
};

const decodeMaterial = <M extends string>(
	material: GltfMaterial,
	materials: Record<M, MaterialProperty>,
): Record<M, number | number[]> => {
	const result = {} as Record<M, number | number[]>;

	for (const [name, property] of entries(materials)) {
		result[name] = fetchProperty(material, property);
	}

	return result;
};

const fetchProperty = (material: GltfMaterial, property: MaterialProperty): number | number[] => {
	switch (property) {
		case 'base':
			return material.getBaseColorFactor() ?? [1, 1, 1, 1];
		case 'roughness':
			return material.getRoughnessFactor() ?? 0.5;
		case 'metallic':
			return material.getMetallicFactor() ?? 0.0;
		default:
			throw new Error(`Unknown material property: ${property}`);
	}
};
