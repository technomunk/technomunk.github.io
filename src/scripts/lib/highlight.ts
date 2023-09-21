export function setHighlight(element: HTMLElement, highlight: boolean) {
    if (highlight) {
        element.classList.add("hl")
    } else {
        element.classList.remove("hl")
    }
}
