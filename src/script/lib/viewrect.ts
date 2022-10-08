/** A view rectangle of something. The x and y coordinates refer to the center point. */
export default class ViewRect {
    x: number
    y: number
    width: number
    height: number

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
    }

    public get minX(): number {
        return this.x - this.width / 2
    }

    public get maxX(): number {
        return this.x + this.width / 2
    }

    public get minY(): number {
        return this.y - this.height / 2
    }

    public get maxY(): number {
        return this.y + this.height / 2
    }

    /** Convert normalized (relative) coordinate to actual ones at that point in view
     * @param x horizontal coordinate (left to right)
     * @param y vertical coordinate (top to bottom)
     */
    public relativeToActual(x: number, y: number): [number, number] {
        return [(x - .5) * this.width, (.5 - y) * this.height]
    }

    /** Convert actual coordinates to normalized (relative) to this view
     * @param x horizontal coordinate
     * @param y vertical coordinate
     * @returns normalized coordinates relative to top left corner of the view
     */
    public actualToRelative(x: number, y: number): [number, number] {
        return [(x - this.x) / this.width - .5, .5 - (y - this.y) / this.height]
    }
}
