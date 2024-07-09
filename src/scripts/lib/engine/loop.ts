import type World from "./world"

export class Loop {
    readonly world: World

    protected _lastTime = performance.now()

    constructor(world: World) {
        this.world = world
    }

    runSystems() {
        const now = performance.now()
        const dt = (now - this._lastTime) / 1_000
        for (const system of this.world.systems) {
            system.run(dt)
        }
        this._lastTime = now
    }

    loop() {
        requestAnimationFrame(() => {
            this.runSystems()
            this.loop()
        })
    }
}
