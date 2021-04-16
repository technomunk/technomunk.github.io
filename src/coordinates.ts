let labelX = document.getElementById('coord-x')!,
	labelY = document.getElementById('coord-y')!;

/** Set the coordinates to display provided values.
 * @param {number} x The horizontal coordinate to display.
 * @param {number} y The vertical coordinate to display.
 */
export function displayCoordinates(x: number, y: number) {
	labelX.textContent = `Re: ${x.toFixed(15)}`;
	labelY.textContent = `Im: ${y.toFixed(15)}`;
}
