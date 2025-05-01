import type { Entity, World } from './entity';

export type Vec3 = [number, number, number];

export interface System {
	/** Execute the system */
	run(world: World<Entity>, dt: number): void;

	/** Setup the system, including internally saving queries necessary to run the system */
	setup?(world: World<Entity>): void;
}
