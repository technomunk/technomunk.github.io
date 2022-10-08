export function hide(element: HTMLElement) {
    element.classList.add("hide")
}

export function show(element: HTMLElement) {
    element.classList.remove("hide")
}

export function toggle(element: HTMLElement) {
    if (element.classList.contains("hide")) {
        show(element)
    } else {
        hide(element)
    }
}
