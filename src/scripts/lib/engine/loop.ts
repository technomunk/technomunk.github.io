import { Cloth, ClothSimulator } from "./cloth"
import type Renderer from "./renderer"
import type Scene from "./scene"

export class Loop {
    readonly scene: Scene
    readonly simulators: Array<ClothSimulator>
    readonly renderer: Renderer

    protected _lastTime = 0
    maxDT = .05

    constructor(scene: Scene, renderer: Renderer) {
        this.scene = scene
        this.simulators = []
        for (const entity of scene.entities) {
            if (entity.mesh instanceof Cloth) {
                this.simulators.push(new ClothSimulator(entity.mesh))
            }
        }
        this.renderer = renderer
        this._lastTime = performance.now()
    }

    drawFrame() {
        const now = performance.now()
        const dt = Math.min((this._lastTime - now) / 1_000, this.maxDT)
        performance.mark("sim-start")
        this.simulate(dt)
        const measure = performance.measure("simulation", "sim-start")
        // console.debug(measure)
        this.renderer.draw(this.scene)
        this._lastTime = now
    }

    simulate(dt: number) {
        for (const simulator of this.simulators) {
            simulator.simulate(this.scene, dt)
        }
    }

    loop() {
        requestAnimationFrame(() => {
            this.drawFrame()
            this.loop()
        })
    }
}
