import { dist2 } from "./util"

export interface SliceEvent {
    ax: number
    ay: number
    bx: number
    by: number
}

export type SliceHandler = (slice: SliceEvent) => void

export class SliceInterpreter {
    protected _handlers: Array<SliceHandler> = []
    protected _lx = 0
    protected _ly = 0

    protected _eventCount = 0
    protected _minDist2: number

    constructor(element: HTMLElement, minDist: number) {
        this._minDist2 = minDist * minDist

        element.addEventListener('pointerdown', this._handlePointerDown.bind(this))
        element.addEventListener('pointermove', this._handlePointerMove.bind(this))
        element.addEventListener('pointerup', this._handlePointerUp.bind(this))
        element.addEventListener('pointercancel', this._handlePointerUp.bind(this))
        element.addEventListener('pointerout', this._handlePointerUp.bind(this))
        element.addEventListener('pointerleave', this._handlePointerUp.bind(this))

        // TODO: gestures too
        // element.addEventListener('gesturestart', this._handleGestureStart.bind(this))
        // element.addEventListener('gesturechange', this._handleGestureChange.bind(this))
        // element.addEventListener('gestureend', this._handleGestureEnd.bind(this))
    }

    public addSliceHandler(handler: SliceHandler): number {
        this._handlers.push(handler)
        return this._handlers.length - 1
    }

    public removeSliceHandler(id: number) {
        if (id < 0 || id >= this._handlers.length) {
            throw "invalid handler id"
        }
        this._handlers.splice(id, 1)
    }

    public get minDist(): number {
        return Math.sqrt(this._minDist2)
    }
    public set minDist(value: number) {
        this._minDist2 = value * value
    }

    protected _handlePointerDown(event: PointerEvent) {
        if (++this._eventCount == 1) {
            this._lx = event.x
            this._ly = event.y
        }
    }
    protected _handlePointerMove(event: PointerEvent) {
        if (this._eventCount == 1) {
            if (dist2(event.x, event.y, this._lx, this._ly) >= this._minDist2) {
                this._fireSlice({ ax: this._lx, ay: this._ly, bx: event.x, by: event.y })
                this._lx = event.x
                this._ly = event.y
            }
        }
    }
    protected _handlePointerUp(event: PointerEvent) {
        if (--this._eventCount == 1) {
            this._lx = event.x
            this._ly = event.y
        } else if (this._eventCount < 0) {
            this._eventCount = 0
        }
    }

    protected _fireSlice(slice: SliceEvent) {
        for (const handler of this._handlers) {
            handler(slice)
        }
    }
}
