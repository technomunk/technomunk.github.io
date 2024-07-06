export interface DragGesture {
    readonly pointerId: number

    readonly isFinished: boolean
    readonly startX: number
    readonly startY: number
    readonly stopX: number
    readonly stopY: number
    readonly dx: number
    readonly dy: number
}

export type Observer<T> = (gesture: T) => void

interface PointerInfo {
    lastX: number
    lastY: number
    downTime: number
}

export class GestureDecoder {
    readonly element: HTMLElement

    protected _pointers: Map<number, PointerInfo> = new Map()
    protected _dragObservers: Array<Observer<DragGesture>> = []

    constructor(element: HTMLElement) {
        this.element = element
        this.element.addEventListener("pointerdown", this._pointerDown.bind(this))
        this.element.addEventListener("pointermove", this._pointerMove.bind(this))
        this.element.addEventListener("pointerup", this._pointerUp.bind(this))
    }

    addDragObserver(observer: Observer<DragGesture>) {
        this._dragObservers.push(observer)
    }

    protected _pointerDown(e: PointerEvent) {
        this._pointers.set(e.pointerId, {
            lastX: e.x,
            lastY: e.y,
            downTime: performance.now(),
        })
    }
    protected _pointerMove(e: PointerEvent) {
        if (!this._pointers.has(e.pointerId)) {
            return
        }

        this._processPointerUpdate(e, false)
    }
    protected _pointerUp(e: PointerEvent) {
        if (!this._pointers.has(e.pointerId)) {
            return
        }

        this._processPointerUpdate(e, true)
        this._pointers.delete(e.pointerId)
    }

    protected _processPointerUpdate(e: PointerEvent, pointerIsDone: boolean) {
        switch (this._pointers.size) {
            case 1:
                // Could also be a click :thonk:
                this._processDrag(e, pointerIsDone)
                break
        }
    }

    protected _processDrag(e: PointerEvent, pointerIsDone: boolean) {
        const pi = this._pointers.get(e.pointerId)!
        const dx = e.x - pi.lastX
        const dy = e.y - pi.lastY

        const gesture: DragGesture = {
            pointerId: e.pointerId,
            isFinished: pointerIsDone,
            startX: pi.lastX,
            startY: pi.lastY,
            stopX: e.x,
            stopY: e.y,
            dx, dy,
        }
        for (const observer of this._dragObservers) {
            observer(gesture)
        }

        pi.lastX = e.x
        pi.lastY = e.y
    }
}
