import type { Camera } from './camera';
import type { Cloth, SphereCollider } from './cloth';
import type { Mesh } from './mesh';
import type { Vec3 } from './types';

export interface Entity {
	/** Position of the entity */
	pos?: Vec3;

	// Rendering-related components
	camera?: Camera;
	mesh?: Mesh;

	// Cloth-sim related components
	cloth?: Cloth;
	collider?: SphereCollider;
}

export { World } from 'miniplex';
