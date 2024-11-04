import Transform from "./transform"
import type { Component, Vec3 } from "./types"

/** An object in the scene */
export default class Entity extends Transform {
    readonly components: Array<Component> = []

    constructor(pos: Vec3 = [0, 0, 0], ...component: Array<Component>) {
        super(pos)
        this.components = component
    }

    hasComponent(type: Function): boolean {
        return this.components.some(component => component instanceof type)
    }
}
