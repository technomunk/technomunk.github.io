
/** An event that is invoked by dragging gestures, ex: mouse-drag. */
export interface DragEvent {
	/** Accumulated horizontal distance since the start of the drag. */
	readonly x: number
	/** Accumulated vertical distance since the start of the drag. */
	readonly y: number
}

/** An event that is invoked by zooming gestures, ex: pinching. */
export interface ZoomEvent {
	/** Horizontal center of the zoom. */
	readonly x: number
	/** Vertical center of the zoom. */
	readonly y: number
	/** Total accumulated scale of the zoom. */
	readonly scale: number
}

/** An event that is invoked by short tapping gestures, ex: click, finger tap */
export interface TapEvent {
	/** Horizontal coordinate of the tap. */
	readonly x: number
	/** Vertical coordinate of the tap. */
	readonly y: number
	/** Duration of the press. */
	readonly duration: number
}

interface EventMap {
	'dragstart': DragEvent,
	'dragupdate': DragEvent,
	'dragstop': DragEvent,

	'zoomstart': ZoomEvent,
	'zoomupdate': ZoomEvent,
	'zoomstop': ZoomEvent,

	'tap': TapEvent,
}

type DragEventHandler = (event: DragEvent) => void
type ZoomEventHandler = (event: ZoomEvent) => void
type TapEventHandler = (event: TapEvent) => void

/** Multi-touch gesture decoder. */
export class GestureDecoder {
	/** Longest valid duration of a tap for it to be treated as such. */
	maxTapDuration = 0.2

	private cache: PointerEvent[] = []
	private x = 0
	private lastX = 0
	private y = 0
	private lastY = 0
	private delta = 0
	private startTime = 0

	private dragStartHandler?: DragEventHandler
	private dragUpdateHandler?: DragEventHandler
	private dragStopHandler?: DragEventHandler

	private zoomStartHandler?: ZoomEventHandler
	private zoomUpdateHandler?: ZoomEventHandler
	private zoomStopHandler?: ZoomEventHandler

	private tapHandler?: TapEventHandler


	/** Construct a gesture decoder based on gestures applied to provided element.
	 * @param element The element which events to decode. It is recommended to add
	 * `touch-action: none` css to this element.
	 */
	public constructor(element: HTMLElement,) {
		element.addEventListener('pointerdown', this.handlePointerDown.bind(this))
		element.addEventListener('pointermove', this.handlePointerMove.bind(this))
		element.addEventListener('pointerup', this.handlePointerUp.bind(this))
		element.addEventListener('pointercancel', this.handlePointerUp.bind(this))
		element.addEventListener('pointerout', this.handlePointerUp.bind(this))
		element.addEventListener('pointerleave', this.handlePointerUp.bind(this))

		element.addEventListener('gesturestart', this.handleGestureStart.bind(this))
		element.addEventListener('gesturechange', this.handleGestureChange.bind(this))
		element.addEventListener('gestureend', this.handleGestureEnd.bind(this))
	}

	/** Set the handler for events of given type.
	 * @param type The type of events to use the provided handler for.
	 * @param handler The event handler to use.
	 */
	public on<K extends keyof EventMap>(type: K, handler: (event: EventMap[K]) => void): void {
		switch (type) {
			case 'dragstart':
				this.dragStartHandler = handler as DragEventHandler
				break
			case 'dragupdate':
				this.dragUpdateHandler = handler as DragEventHandler
				break
			case 'dragstop':
				this.dragStopHandler = handler as DragEventHandler
				break
			case 'zoomstart':
				this.zoomStartHandler = handler as ZoomEventHandler
				break
			case 'zoomupdate':
				this.zoomUpdateHandler = handler as ZoomEventHandler
				break
			case 'zoomstop':
				this.zoomStopHandler = handler as ZoomEventHandler
				break
			case 'tap':
				this.tapHandler = handler as TapEventHandler
				break
		}
	}

	private handlePointerDown(event: PointerEvent) {
		this.startTime = performance.now() / 1_000
		this.cache.push(event)

		// Start or stop relevant gestures.
		switch (this.cache.length) {
			case 1:
				this.startDrag()
				break
			case 2:
				this.stopDrag()
				this.startZoom()
				break
			case 3:
				this.stopZoom()
				break
			default:
			// Do nothing.
		}
	}

	private handlePointerMove(event: PointerEvent) {
		const index = this.cache.findIndex(e => e.pointerId == event.pointerId)
		if (index != -1) {
			this.cache[index] = event
		}

		switch (this.cache.length) {
			case 1:
				this.updateDrag()
				break
			case 2:
				this.updateZoom()
				break
			default:
			// Do nothing.
		}
	}

	private handlePointerUp(event: PointerEvent) {
		let deferStartDrag = false

		const duration = performance.now() / 1_000 - this.startTime
		if (this.tapHandler && duration > this.maxTapDuration) {
			this.tapHandler({ x: event.x, y: event.y, duration: duration })
		}

		// Start or stop relevant gestures.
		switch (this.cache.length) {
			case 1:
				this.stopDrag()
				break
			case 2:
				this.stopZoom()
				deferStartDrag = true
				break
			case 3:
				this.startZoom()
				break
			default:
			// Do nothing.
		}

		const index = this.cache.findIndex(e => e.pointerId == event.pointerId)
		if (index != -1) {
			this.cache.splice(index, 1)
		}

		if (deferStartDrag) {
			this.startDrag()
		}
	}

	private handleGestureStart(event: any) {
		event.preventDefault()
		this.x = event.clientX
		this.y = event.clientY

		if (this.dragStartHandler) {
			this.dragStartHandler({
				x: 0,
				y: 0,
			})
		}
		if (this.zoomStartHandler) {
			this.zoomStartHandler({
				x: this.x,
				y: this.y,
				scale: 1,
			})
		}

		this.lastX = event.clientX
		this.lastY = event.clientY
	}
	private handleGestureChange(event: any) {
		event.preventDefault()
		this.lastX = event.clientX
		this.lastY = event.clientY

		if (this.dragUpdateHandler && (this.lastX != event.clientX || this.lastY != event.clientY)) {
			this.dragUpdateHandler({
				x: event.clientX - this.lastX,
				y: event.clientY - this.lastY,
			})
		}
		if (this.zoomUpdateHandler) {
			this.zoomUpdateHandler({
				x: event.clientX,
				y: event.clientY,
				scale: event.scale,
			})
		}

		this.lastX = event.clientX
		this.lastY = event.clientY
	}
	private handleGestureEnd(event: any) {
		event.preventDefault()
		if (this.dragStopHandler) {
			this.dragStopHandler({
				x: event.clientX - this.lastX,
				y: event.clientY - this.lastY,
			})
		}
		if (this.zoomStopHandler) {
			this.zoomStopHandler({
				x: event.clientX,
				y: event.clientY,
				scale: event.scale,
			})
		}
	}

	/** Start the drag gesture.
	 *
	 * Uses this.cache[0] pointer.
	 * Uses this.x and this.y.
	 */
	private startDrag() {
		this.x = this.cache[0].clientX
		this.y = this.cache[0].clientY
		if (this.dragStartHandler != null) {
			this.dragStartHandler({
				x: this.cache[0].clientX - this.x,
				y: this.cache[0].clientY - this.y,
			})
		}
	}
	/** Continue the drag gesture.
	 *
	 * Uses this.cache[0] pointer.
	 * Uses this.x and this.y.
	 */
	private updateDrag() {
		if (this.dragUpdateHandler != null) {
			this.dragUpdateHandler({
				x: this.cache[0].clientX - this.x,
				y: this.cache[0].clientY - this.y,
			})
		}
	}
	/** Stop the drag gesture.
	 *
	 * Uses this.cache[0] pointer.
	 * Uses this.x and this.y.
	 */
	private stopDrag() {
		if (this.dragStopHandler != null) {
			this.dragStopHandler({
				x: this.cache[0].clientX - this.x,
				y: this.cache[0].clientY - this.y,
			})
		}
	}

	/** Start the zoom gesture.
	 *
	 * Uses this.cache[0] and this.cache[1] pointers.
	 * Uses this.delta.
	 */
	private startZoom() {
		const deltaX = this.cache[0].clientX - this.cache[1].clientX
		const deltaY = this.cache[0].clientY - this.cache[1].clientY
		this.delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

		if (this.zoomStartHandler != null) {
			const x = (this.cache[0].clientX + this.cache[1].clientX) / 2
			const y = (this.cache[0].clientY + this.cache[1].clientY) / 2

			this.zoomStartHandler({ x: x, y: y, scale: 1, })
		}
	}
	/** Continue the zoom gesture.
	 *
	 * Uses this.cache[0] and this.cache[1] pointers.
	 * Uses this.x and this.y.
	 */
	private updateZoom() {
		if (this.zoomUpdateHandler != null) {
			const x = (this.cache[0].clientX + this.cache[1].clientX) / 2
			const y = (this.cache[0].clientY + this.cache[1].clientY) / 2
			const deltaX = this.cache[0].clientX - this.cache[1].clientX
			const deltaY = this.cache[0].clientY - this.cache[1].clientY
			const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

			this.zoomUpdateHandler({ x: x, y: y, scale: delta / this.delta, })
		}
	}
	/** Stop the zoom gesture.
	 *
	 * Uses this.cache[0] and this.cache[1] pointers.
	 * Uses this.x and this.y.
	 */
	private stopZoom() {
		if (this.zoomStopHandler != null) {
			const x = (this.cache[0].clientX + this.cache[1].clientX) / 2
			const y = (this.cache[0].clientY + this.cache[1].clientY) / 2
			const deltaX = this.cache[0].clientX - this.cache[1].clientX
			const deltaY = this.cache[0].clientY - this.cache[1].clientY
			const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

			this.zoomStopHandler({ x: x, y: y, scale: delta / this.delta, })
		}
	}
}
