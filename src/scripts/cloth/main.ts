import { PerspectiveCamera } from "@lib/engine/camera"
import { Cloth, ClothSimSystem, SphereCollider } from "@lib/engine/cloth"
import Entity from "@lib/engine/entity"
import { Loop } from "@lib/engine/loop"
import { Renderer, RenderSystem } from "@lib/engine/renderer"
import { IcoSphere } from "@lib/engine/shape"
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
    const cameraEntity = world.entities.find(entity => entity.hasComponent(PerspectiveCamera))!
    const camera = cameraEntity.components.find(component => component instanceof PerspectiveCamera)!

    const loop = new Loop(world)
    const gd = new GestureDecoder(canvas)
    gd.addDragObserver((drag) => {
        const matrix = mat4.create()
        mat4.fromRotation(matrix, -drag.dx * 1e-3, [0, 1, 0])
        mat4.rotate(matrix, matrix, -drag.dy * 1e-3, camera.calcRight(cameraEntity.pos))
        const result = vec4.fromValues(...cameraEntity.pos, 1)
        vec4.transformMat4(result, result, matrix)
        cameraEntity.pos.splice(0, 3, result[0], result[1], result[2])
    })

    loop.loop()
}

function createWorld(renderer: Renderer): World {
    const world = new World(new RenderSystem(renderer), new ClothSimSystem())

    // const sphere = new IcoSphere(.25).constructMesh("line");

    world.addEntity(new Entity([0, 1.2, -1.5], new PerspectiveCamera()))
    world.addEntity(new Entity([0, 0, 0], new SphereCollider(.5)))

    const particleCount = isMobile() ? 50 : 200
    const cloth = new Cloth([0, 1, 1], particleCount)
    world.addEntity(new Entity([0, 0, 0], cloth, cloth.mesh))

    return world
}

window.addEventListener("load", setup, { once: true })
