import type { System } from "./types"
import Entity from "./entity"

export default class World {
    readonly systems: Array<System>
    readonly entities: Array<Entity> = []

    constructor(...systems: Array<System>) {
        this.systems = systems
    }

    addEntity(entity: Entity) {
        this.entities.push(entity)
        for (const system of this.systems) {
            system.onEntityAdded(entity)
        }
    }
}
