import { PerspectiveCamera, type Camera } from "./camera"
import Entity from "./entity"
import { WireCube } from "./shape"


export default class Scene {
    readonly entities: Array<Entity>
    readonly camera: Camera

    constructor(entities: Array<Entity> = [], camera: Camera = new PerspectiveCamera()) {
        this.entities = entities
        this.camera = camera
    }

    static TEST_SCENE(): Scene {
        const entities = [
            new Entity([0, 0, 0], new WireCube(.5)),
        ]
        return new Scene(entities, new PerspectiveCamera(
            [0, 1, -1.2],
        ))
    }
}
