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

export type Bounds<T> = [T, T]

export function randRange(min: number, max: number) {
	return min + Math.random() * (max - min)
}
