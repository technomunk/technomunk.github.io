export default class SlideMenu extends HTMLElement {
    private flap: HTMLElement

    constructor() {
        super()

        this.flap = document.getElementById(`${this.id}-flap`) || document.createElement("button")
        this.parentNode?.appendChild(this.flap)

        this.classList.add("slide-body")
        this.flap.classList.add("slide-flap")

        this.positionFlap()
        const repositionFlap = this.positionFlap.bind(this)
        window.addEventListener("resize", repositionFlap)
        this.addEventListener("resize", repositionFlap)
    }

    public get vertical(): boolean {
        return window.innerHeight > window.innerWidth
    }
    

    private positionFlap() {
        if (window.innerWidth >= window.innerHeight) {
            this.flap.style.bottom = ""
            this.flap.style.right = `${this.clientWidth}px`
        } else {
            const rotationAdjustment = this.flap.clientHeight - 2*this.flap.clientWidth
            this.flap.style.right = ""
            this.flap.style.bottom = `${this.clientHeight - rotationAdjustment}px`
        }
    }
}
