interface Position {
	x: number,
	y: number,
}

/** Transform client-relative coordinates to dom-relative coordinates.
 * @param client
 * @param rect
 * @returns relative position to the rect's origin in rect-space
 */
export function clientToRect(client: Position, rect: DOMRect): Position {
	const x = (client.x - rect.x) / rect.width;
	const y = (client.y - rect.y) / rect.height;
	return { x, y };
}

export function error(message: string): never {
	alert(message)
	throw new Error(message)
}

export class Choice<T> extends Array<T> {
	constructor(...items: T[]) {
		super(...items)
	}
	random(): T {
		return this[Math.floor(Math.random() * this.length)]
	}
}

export type Bounds<T> = [T, T]
export function randRange(min: number, max: number): number {
	return min + Math.random() * (max - min)
}

export function dist2(ax: number, ay: number, bx: number, by: number) {
	const dx = ax - bx
	const dy = ay - by
	return dx * dx + dy * dy
}

export function clamp(v: number, min: number, max: number): number {
	return Math.max(Math.min(v, max), min)
}

export function isMobile(): boolean {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function lines(text: string): string[] {
	const result = text.split(/\r?\n/)
	let emptyIdx = 0
	for (let i = 0; i < result.length; ++i) {
		if (result[i].length == 0) {
			emptyIdx = i
		}
	}
	result.splice(emptyIdx)
	return result
}
