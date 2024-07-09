import type Entity from "./entity"

export type Vec3 = [number, number, number]
export interface Component {}
export interface System {
    onEntityAdded(entity: Entity): void
    run(dt: number): void
}
