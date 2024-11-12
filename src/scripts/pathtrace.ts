import { GestureDecoder } from "@lib/gesture"
import FragmentRenderer from "@lib/webgl/fragment"
import { composeUniformSetters, setUniforms, setupCubemap } from "@lib/webgl/util"

import PATHTRACE_SHADER from "@shader/pathtrace.fs"
import { mat3, mat4, vec3 } from "gl-matrix"

function lookIn(dir: vec3, up: vec3 = [0, 1, 0]): mat3 {
    const x = vec3.cross(vec3.create(), up, dir)
    vec3.normalize(x, x)
    const y = vec3.cross(vec3.create(), dir, x)
    return mat3.fromValues(
        x[0], x[1], x[2],
        y[0], y[1], y[2],
        dir[0], dir[1], dir[2],
    )
}

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

    const pos = vec3.fromValues(0, 0, -3);

    setUniforms(setters, {
        uResolution: [canvas.width, canvas.height],
        uCamPos: pos,
        uView: lookIn([0, 0, 1]),
        uCamFov: Math.PI / 4,
        uSkybox: setupCubemap(renderer.context, { onComplete: () => renderer.draw() }),
    })

    const gd = new GestureDecoder(canvas)

    gd.addDragObserver((d) => {
        vec3.rotateY(pos, pos, [0, 0, 0], d.dx / window.innerWidth * Math.PI)
        setUniforms(setters, {
            uCamPos: pos,
            uView: lookIn(vec3.normalize(vec3.create(), vec3.negate(vec3.create(), pos))),
        })
        renderer.draw()
    })

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        renderer.context.viewport(0, 0, canvas.width, canvas.height)
        renderer.draw()
    })
    window.addEventListener("keypress", (e) => {
        if (e.key == " ") {
            renderer.draw()
        }
    })
}

window.addEventListener("load", setup, { once: true })
