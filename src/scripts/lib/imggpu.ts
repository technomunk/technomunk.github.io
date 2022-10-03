import { compileProgram, setupFullviewQuad } from "./glutil"

const CONTEXT_OPTIONS: WebGLContextAttributes = {
    alpha: false,
    depth: false,
    desynchronized: true,
    failIfMajorPerformanceCaveat: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: true,
    stencil: false,
}

export interface ImageOptions {
    width: number,
    height: number,
    shader: string,
}

export type Uniforms = {
    [key: string]: number | [number, number] | [number, number, number] | [number, number, number, number]
}

export async function generate_image(
    shader: string,
    width: number,
    height: number,
    uniforms: Uniforms)
    : Promise<CanvasImageSource>
{
    const canvas = document.createElement("canvas")
    canvas.width = width, canvas.height = height

    const gl = canvas.getContext("webgl", CONTEXT_OPTIONS)
    if (!gl) {
        throw "WebGL not supported"
    }

    const [vertex, fragment] = await Promise.all([
		fetch('shaders/identity.vs', { mode: "same-origin", }).then(response => response.text()),
		fetch(`shaders/${shader}.fs`, { mode: "same-origin", }).then(response => response.text()),
    ])
    const program = compileProgram(gl, vertex, fragment)
    setupFullviewQuad(gl, program, "aPos")

    gl.useProgram(program)

    for (const [name, value] of Object.entries(uniforms)) {
        const location = gl.getUniformLocation(program, name)
        if (!location) {
            throw `"${name}" uniform could not be found`
        }
        if (value instanceof Array) {
            switch (value.length) {
                case 2: gl.uniform2f(location, ...value); break
                case 3: gl.uniform3f(location, ...value); break
                case 4: gl.uniform4f(location, ...value); break
            }
        } else {
            gl.uniform1i(location, value)
        }
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    return canvas
}
