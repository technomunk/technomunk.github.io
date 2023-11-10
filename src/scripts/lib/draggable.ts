import { error } from "./util"

export function makeSVGMovable(element: SVGGeometryElement, callback?: () => void) {
    let dragging = false
    let offset = [0, 0]

    element.addEventListener("mousedown", (event) => {
        event.preventDefault()
        dragging = true
        element.classList.add("dragging")
        offset = getPointerPos(event, element)
    })
    
    element.addEventListener("mouseup", (event) => {
        event.preventDefault()
        dragging = false
        element.classList.remove("dragging")
        callback && callback()
    })
    
    element.addEventListener("mousemove", (event) => {
        event.preventDefault()
        if (dragging) {
            const [x, y] = getPointerPos(event, element)
            element.setAttribute("cx", x.toString())
            element.setAttribute("cy", y.toString())
            callback && callback()
        }
    })
}

function getPointerPos(event: MouseEvent, svg: SVGGeometryElement): [number, number] {
    const ctm = svg.getScreenCTM() || error("Could not get screen CTM")
    return [(event.clientX - ctm.e) / ctm.a, (event.clientY - ctm.f) / ctm.d]
}
