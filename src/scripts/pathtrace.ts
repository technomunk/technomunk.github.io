import { GestureDecoder } from "@lib/gesture"
import { Mat3, Vec3 } from "@lib/math"
import FragmentRenderer from "@lib/webgl/fragment"
import { composeUniformSetters, setUniforms, setupCubemap } from "@lib/webgl/util"

import PATHTRACE_SHADER from "@shader/pathtrace.fs"


function setup() {
    const ratio = 1
    // const canvas = new OffscreenCanvas(
    //     Math.ceil(window.innerWidth * ratio),
    //     Math.ceil(window.innerHeight * ratio),
    // )
    const canvas = document.querySelector("canvas#main") as HTMLCanvasElement
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const renderer = new FragmentRenderer(canvas)
    renderer.context.viewport(0, 0, canvas.width, canvas.height)

    renderer.setShader(PATHTRACE_SHADER)
    const setters = composeUniformSetters(renderer.context, renderer.program!)

    let pos = new Vec3(2, .2, -.2);

    setUniforms(setters, {
        uResolution: [canvas.width, canvas.height],
        uCamPos: pos,
        uView: Mat3.lookIn(Vec3.ZERO.sub(pos).normalize()),
        uCamFov: Math.PI / 4,
        uSkybox: setupCubemap(renderer.context, { onComplete: () => renderer.draw() }),
    })

    const gd = new GestureDecoder(canvas)

    gd.addDragObserver((d) => {
        pos = pos.rotate(Vec3.Y, d.dx / window.innerWidth * Math.PI)
        pos = pos.rotate(Vec3.cross(pos, Vec3.Y).normalize(), d.dy / window.innerHeight * Math.PI)
        setUniforms(setters, {
            uCamPos: pos,
            uView: Mat3.lookIn(Vec3.ZERO.sub(pos).normalize()),
        })
        renderer.draw()
    })

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        renderer.context.viewport(0, 0, canvas.width, canvas.height)
        setUniforms(setters, {
            uResolution: [canvas.width, canvas.height],
        })
        renderer.draw()
    })
    window.addEventListener("keypress", (e) => {
        if (e.key == " ") {
            renderer.draw()
        }
    })
    window.addEventListener("wheel", (e) => {
        if (e.deltaY < 0 && pos.norm2() < 4) {
            return
        }
        pos.muli(1 + (e.deltaY / 1000))
        setUniforms(setters, {uCamPos: pos})
        renderer.draw()
    })
}

window.addEventListener("load", setup, { once: true })
