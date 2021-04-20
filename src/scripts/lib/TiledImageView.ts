export type RequestTileFn = (x: number, y: number) => Promise<ImageData>;
export type CancelTilesFn = () => void;

/** A view of an image that is drawn in tiles.
 *
 * Can be panned or zoomed, which will request new tiles as necessary.
 */
export default class TiledImageView {

	private canvas: HTMLCanvasElement;
	private context: CanvasRenderingContext2D;
	private tw: number;
	private th: number;

	private requestTileCb: RequestTileFn;

	private tiles: Map<string, Promise<ImageData | undefined>> = new Map();

	private x: number;
	private y: number;

	/**
	 * @param {HTMLCanvasElement} canvas The canvas to use.
	 * @param {RequestTileFn} tileCallback The function to invoke when a new tile needs to be drawn.
	 * @param {number} x The coordinate of the left edge of the canvas.
	 * @param {number} y The coordinate of the top edge of the canvas.
	 * @param {number} tileWidth Width of a single tile of the processed image in pixels.
	 * @param {number} tileHeight Height of a single tile of the processed image in pixels.
	 */
	public constructor(
		canvas: HTMLCanvasElement,
		tileCallback: RequestTileFn,
		x = 0,
		y = 0,
		tileWidth = 64,
		tileHeight = 64,
	) {
		this.canvas = canvas;
		this.context = canvas.getContext('2d', { alpha: false, })!;
		this.tw = tileWidth;
		this.th = tileHeight;
		this.requestTileCb = tileCallback;
		this.x = x;
		this.y = y;
	}

	/** Get default viewport for the current canvas. */
	public get defaultViewport() {
		if (this.canvas.width >= this.canvas.height) {
			let ratio = this.canvas.width / this.canvas.height;
			return new DOMRect(-ratio, -1, 2*ratio, 2);
		} else {
			let ratio = this.canvas.height / this.canvas.width;
			return new DOMRect(-1, -ratio, 2, 2*ratio);
		}
	}

	/** Get the width of a single tile used by the view in pixels. */
	public get tileWidth() {
		return this.tw;
	}

	/** Get the height of a single tile used by the view in pixels. */
	public get tileHeight() {
		return this.th;
	}

	/** Update the displayed image using current config, effectively redrawing it. */
	public draw() {		
		let minX = Math.floor(this.x / this.tw);
		let maxX = minX + Math.ceil(this.canvas.width / this.tw);

		let minY = Math.floor(this.y / this.th);
		let maxY = minY + Math.ceil(this.canvas.height / this.th);
		
		for (var tileY = minY; tileY < maxY; ++tileY) {
			for (var tileX = minX; tileX < maxX; ++tileX) {
				this.requestTile(tileX, tileY);
			}
		}
	}

	/** Clear any cached tiles, resulting in calls to update() to request all tiles anew.
	 * @param take optional function that is provided released image data for reuse.
	 */
	public clearCachedTiles(take?: (data: ImageData) => void) {
		if (take != null) {
			this.tiles.forEach(promise => promise.then(image => {
				if (image) {
					take(image);
				}
			}));
		}
		this.tiles.clear();
	}

	/** Shift the image provided number of pixels.
	 * @param {number} dx Horizontal number of pixels to shift the image by.
	 * @param {number} dy Vertical number of pixels to shift the image by.
	 */
	public pan(dx: number, dy: number) {
		let midX = dx >= 0 ? dx : this.canvas.width + dx,
			midY = dy >= 0 ? dy : this.canvas.height + dy,
			quadrants: DOMRect[] = [];

		quadrants = [
			new DOMRect(0, 0, midX, midY),
			new DOMRect(midX, 0, this.canvas.width - midX, midY),
			new DOMRect(0, midY, midX, this.canvas.height - midY),
			new DOMRect(midX, midY, this.canvas.width - midX, this.canvas.height - midY),
		];

		// Move the clean image to correct spot.
		if (dx < 0 && dy < 0) {
			let imageData = this.context.getImageData(-dx, -dy, quadrants[0].width, quadrants[0].height);
			this.context.putImageData(imageData, 0, 0);
		} else if (dx >= 0 && dy < 0) {
			let imageData = this.context.getImageData(0, -dy, quadrants[1].width, quadrants[1].height);
			this.context.putImageData(imageData, dx, 0);
		} else if (dx < 0 && dy >= 0) {
			let imageData = this.context.getImageData(-dx, 0, quadrants[2].width, quadrants[2].height);
			this.context.putImageData(imageData, 0, dy);
		} else if (dx >= 0 && dy >= 0) {
			let imageData = this.context.getImageData(0, 0, quadrants[3].width, quadrants[3].height);
			this.context.putImageData(imageData, dx, dy);
		}

		this.x -= dx;
		this.y -= dy;

		this.draw();
	}

	/** Zoom the image in or out around a provided point.
	 * @param {number} x The horizontal index of the pixel around which to zoom.
	 * @param {number} y The vertical index of the pixel around which to zoom.
	 * @param {number} scale The ratio by how much to zoom the picture.
	 */
	public zoom(x: number, y: number, scale: number) {
		let relX = x / this.canvas.width,
			relY = y / this.canvas.height;

		// Reuse the existent image while the workers are redrawing it.
		if (scale > 1) {
			let invScale = 1 / scale;
			let nx = x * (1 - invScale);
			let ny = y * (1 - invScale);
			this.context.drawImage(
				this.canvas,
				nx,
				ny,
				this.canvas.width * invScale,
				this.canvas.height * invScale);
			this.x += Math.round(nx);
			this.y += Math.round(ny);
		} else {
			let nx = x * (1 - scale);
			let ny = y * (1 - scale);
			this.context.drawImage(
				this.canvas,
				nx,
				ny,
				this.canvas.width * scale,
				this.canvas.height * scale,
				0,
				0,
				this.canvas.width,
				this.canvas.height);
			this.x += Math.round(nx);
			this.y += Math.round(ny);
		}

		this.clearCachedTiles();
		this.draw();
	}

	/** Resize the view.
	 * @param {number} width The new width of the view in pixels.
	 * @param {number} height The new height of the view in pixels.
	 */
	public resize(width: number, height: number) {
		let fillStyle = this.context.fillStyle;
		this.canvas.width = width;
		this.canvas.height = height;
		this.context.fillStyle = fillStyle;
		this.draw();
	}

	/** Request a tile to be redrawn.
	 * @param {number} x The horizontal index of the tile.
	 * @param {number} y The vertical index of the tile.
	 */
	private requestTile(x: number, y: number) {
		let key = `${x}|${y}`;
		let promise = this.tiles.get(key) || this.requestTileCb(x, y);
		promise = promise.then(
			image => {
				if (image != null) {
					this.context.putImageData(image, x*this.tw - this.x, y*this.th - this.y);
				}
				return image;
			},
			() => { this.tiles.delete(key); return undefined });
		this.tiles.set(key, promise);
	}
}
