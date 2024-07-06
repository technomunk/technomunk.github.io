import Renderer from "@lib/engine/renderer"
import Scene from "@lib/engine/scene"
import { GestureDecoder } from "@lib/gesture"
import { mat3, mat4, vec3, vec4 } from "gl-matrix"


function setup() {
    const canvas = document.querySelector("canvas#main") as HTMLCanvasElement
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const scene = Scene.TEST_SCENE()
    const renderer = new Renderer(canvas)
    window.addEventListener("resize", () => {
        renderer.resize(window.innerWidth, window.innerHeight)
        renderer.draw(scene)
    })

    const drawFrame = () => {
        renderer.draw(scene)
        requestAnimationFrame(drawFrame)
    }
    const gd = new GestureDecoder(canvas)
    gd.addDragObserver((drag) => {
        const matrix = mat4.create()
        mat4.fromRotation(matrix, -drag.dx * 1e-3, [0, 1, 0])
        mat4.rotate(matrix, matrix, -drag.dy * 1e-3, scene.camera.right)
        const result = vec4.fromValues(...scene.camera.position, 1)
        vec4.transformMat4(result, result, matrix)
        scene.camera.position.splice(0, 3, result[0], result[1], result[2])
    })

    drawFrame()
}

window.addEventListener("load", setup, { once: true })
