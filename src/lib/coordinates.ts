/* eslint-disable @typescript-eslint/no-non-null-assertion */

/** Set the coordinates to display provided values.
 * @param {number} x The horizontal coordinate to display.
 * @param {number} y The vertical coordinate to display.
 */
export function displayCoordinates(x: number, y: number): void {
	document.getElementById('coord-x')!.textContent = `Re: ${x.toFixed(15)}`;
	document.getElementById('coord-y')!.textContent = `Im: ${y.toFixed(15)}`;
}
