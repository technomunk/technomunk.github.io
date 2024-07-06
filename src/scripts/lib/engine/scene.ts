import { PerspectiveCamera, type Camera } from "./camera"
import Entity from "./entity"

export default class Scene {
    readonly entities: Array<Entity>
    readonly camera: Camera
    isDirty: boolean = true

    constructor(
        entities: Array<Entity> = [],
        camera: Camera = new PerspectiveCamera(),
    ) {
        this.entities = entities
        this.camera = camera
    }
}
