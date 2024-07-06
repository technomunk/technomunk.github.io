import { PerspectiveCamera } from "@lib/engine/camera"
import { Cloth, ClothSimulator } from "@lib/engine/cloth"
import Entity from "@lib/engine/entity"
import { Loop } from "@lib/engine/loop"
import Renderer from "@lib/engine/renderer"
import Scene from "@lib/engine/scene"
import { WireCube } from "@lib/engine/shape"
import { GestureDecoder } from "@lib/gesture"
import { mat4, vec4 } from "gl-matrix"


function setup() {
    const canvas = document.querySelector("canvas#main") as HTMLCanvasElement
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const scene = createScene()
    
    const renderer = new Renderer(canvas)
    window.addEventListener("resize", () => {
        renderer.resize(window.innerWidth, window.innerHeight)
        renderer.draw(scene)
    })
    
    window.addEventListener("keypress", (e) => {
        if (e.key == " ") {
            loop.simulate(0.05)
        }
    })
    const loop = new Loop(scene, renderer)
    const gd = new GestureDecoder(canvas)
    gd.addDragObserver((drag) => {
        const matrix = mat4.create()
        mat4.fromRotation(matrix, -drag.dx * 1e-3, [0, 1, 0])
        mat4.rotate(matrix, matrix, -drag.dy * 1e-3, scene.camera.right)
        const result = vec4.fromValues(...scene.camera.position, 1)
        vec4.transformMat4(result, result, matrix)
        scene.camera.position.splice(0, 3, result[0], result[1], result[2])
    })

    loop.loop()
}

function createScene(): Scene {
    const cloth = new Cloth(50)
    const entities = [
        // new Entity([0, 0, 0], new WireCube(.5)),
        new Entity([0, 0, 0], cloth)
    ]
    return new Scene(
        entities,
        new PerspectiveCamera([0, 1.2, -1.5]),
    )
}

window.addEventListener("load", setup, { once: true })
