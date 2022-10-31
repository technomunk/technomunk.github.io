export default class SlideMenu extends HTMLElement {
    private flap: HTMLElement
    private normalSize: number = 0
    private padding: number = 0

    constructor() {
        super()
        this.flap = document.getElementById(`${this.id}-flap`) || document.createElement("button")

        this.classList.add("slide-body")
        this.flap.classList.add("slide-flap")

        this.calculateNormalSize()
        window.addEventListener("resize", () => {
            const hide = this.isHidden
            this.style.bottom = ""
            this.style.right = ""
            this.style.width = ""
            this.style.height = ""
            this.calculateNormalSize()
            this.stretchTo(hide ? 0 : this.normalSize, true)
        })

        this.setupFlap()
        this.stretchTo(0)
    }

    public get isVertical(): boolean {
        return window.innerHeight >= window.innerWidth
    }

    public get isHidden(): boolean {
        return this.hiddenPixels * 2 >= this.normalSize
    }

    public set isHidden(value: boolean) {
        this.stretchTo(value ? 0 : this.normalSize, true)
    }

    private get hiddenPixels(): number {
        return -parseFloat(this.style.bottom.replace("px", "")) || -parseFloat(this.style.right.replace("px", "")) || 0
    }

    private positionFlap() {
        if (this.isVertical) {
            const rotationAdjustment = this.flap.offsetHeight - 2 * this.flap.offsetWidth
            this.flap.style.right = ""
            this.flap.style.bottom = `${this.clientHeight - this.hiddenPixels - rotationAdjustment}px`
        } else {
            this.flap.style.bottom = ""
            this.flap.style.right = `${this.clientWidth - this.hiddenPixels}px`
        }
    }

    private stretchTo(size: number, clamp: boolean = false) {
        if (clamp) {
            if ((size * 2) >= this.normalSize) {
                size = this.normalSize
            } else {
                size = 0
            }
        }

        if (size >= this.normalSize) {
            if (this.isVertical) {
                this.style.height = `${size - this.padding}px`
                this.style.bottom = "0"
            } else {
                this.style.width = `${size - this.padding}px`
                this.style.right = "0"
            }
        } else {
            if (this.isVertical) {
                this.style.height = `${this.normalSize - this.padding}px`
                this.style.bottom = `${size - this.offsetHeight}px`
            } else {
                this.style.width = `${this.normalSize - this.padding}px`
                this.style.right = `${size - this.offsetWidth}px`
            }
        }
        this.positionFlap()
    }

    private setupFlap() {
        this.flap.draggable = true
        let s: number, p: number, sp: number
        this.flap.onpointerdown = e => {
            s = this.normalSize - this.hiddenPixels
            p = this.isVertical ? e.y : e.x
            sp = p
            e.preventDefault()

            document.onpointermove = e => {
                const delta = this.isVertical ? e.y - p : e.x - p
                this.stretchTo(s - delta)
                e.preventDefault()
            }

            document.onpointerup = e => {
                document.onpointerup = null
                document.onpointermove = null
                const sDelta = this.isVertical ? e.y - sp : e.x - sp
                if (sDelta < 10) {
                    this.isHidden = !this.isHidden
                } else {
                    const delta = this.isVertical ? e.y - p : e.x - p
                    this.stretchTo(s - delta, true)
                }
                e.preventDefault()
            }
        }
    }

    private calculateNormalSize() {
        // TODO: fetch padding programmatically
        if (this.isVertical) {
            this.padding = 40
            this.normalSize = this.clientHeight
        } else {
            this.padding = 20
            this.normalSize = this.clientWidth
        }
    }
}
