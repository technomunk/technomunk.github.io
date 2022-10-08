export default class SlideMenu extends HTMLElement {
    private flap: HTMLElement

    constructor() {
        super()

        this.flap = document.getElementById(`${this.id}-flap`) || document.createElement("button")
        this.parentNode?.appendChild(this.flap)

        this.classList.add("slide-body")
        this.flap.classList.add("slide-flap")
    }
}
