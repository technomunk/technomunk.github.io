/** A rectangular view around a specified point. */
export default class ViewRect {

	public x: number;
	public y: number;
	public width: number;
	public height: number;

	public constructor(x: number, y: number, width: number, height: number) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	public get minX() {
		return this.x - this.halfWidth;
	}
	public set minX(val) {
		this.x = val + this.halfWidth;
	}

	public get minY() {
		return this.y - this.halfHeight;
	}
	public set minY(val) {
		this.y = val + this.halfHeight;	
	}

	public get midX() {
		return this.x;
	}
	public set midX(val) {
		this.x = val;
	}
	
	public get midY() {
		return this.y;
	}
	public set midY(val) {
		this.y = val;
	}

	public get maxX() {
		return this.x + this.halfWidth;
	}
	public set maxX(val) {
		this.x = val - this.halfWidth;
	}

	public get maxY() {
		return this.y + this.halfHeight;
	}
	public set maxY(val) {
		this.y = val - this.halfHeight;
	}

	public get halfWidth() {
		return this.width*.5;
	}

	public get halfHeight() {
		return this.height*.5;
	}

	/** Pan (translate) the view a given amount.
	 * @param dx The horizontal amount to translate.
	 * @param dy The vertical amount to translate.
	 */
	public pan(dx: number, dy: number) {
		this.x += dx;
		this.y += dy;
	}

	/** Scale the view around the provided point or the center of the view.
	 * @param scale The amount to multiply the view size by.
	 * @param nx The (optional) normalized point around which to scale.
	 * @param ny The (optional) normalized point around which to scale.
	 */
	public scale(scale: number, nx: number = .5, ny: number = .5) {
		throw new Error("Not implemented yet");
	}
}
