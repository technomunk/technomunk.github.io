import { PerspectiveCamera } from "@lib/engine/camera"
import { Cloth, ClothSimSystem } from "@lib/engine/cloth"
import Entity from "@lib/engine/entity"
import { Loop } from "@lib/engine/loop"
import { Renderer, RenderSystem } from "@lib/engine/renderer"
import World from "@lib/engine/world"
import { GestureDecoder } from "@lib/gesture"
import { isMobile } from "@lib/util"
import { mat4, vec4 } from "gl-matrix"


function setup() {
    const canvas = document.querySelector("canvas#main") as HTMLCanvasElement
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    
    const renderer = new Renderer(canvas)
    window.addEventListener("resize", () => {
        renderer.resize(window.innerWidth, window.innerHeight)
    })
    
    const world = createWorld(renderer)

    const loop = new Loop(world)
    const gd = new GestureDecoder(canvas)
    // gd.addDragObserver((drag) => {
    //     const matrix = mat4.create()
    //     mat4.fromRotation(matrix, -drag.dx * 1e-3, [0, 1, 0])
    //     mat4.rotate(matrix, matrix, -drag.dy * 1e-3, scene.camera.right)
    //     const result = vec4.fromValues(...scene.camera.position, 1)
    //     vec4.transformMat4(result, result, matrix)
    //     scene.camera.position.splice(0, 3, result[0], result[1], result[2])
    // })

    loop.loop()
}

function createWorld(renderer: Renderer): World {
    const world = new World(new RenderSystem(renderer), new ClothSimSystem())
    
    world.addEntity(new Entity([0, 1.2, -1.5], new PerspectiveCamera()))
    
    const particleCount = isMobile() ? 50 : 200
    const cloth = new Cloth(particleCount)
    world.addEntity(new Entity([0, 0, 0], cloth, cloth.mesh))

    return world
}

window.addEventListener("load", setup, { once: true })
