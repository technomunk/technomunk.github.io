'use strict';

/** A view of a procedural image that can be panned or zoomed.
 * Takes a canvas element to draw the image on. Does not capture inputs, only handles drawing the actual image. 
 */
class ProceduralImageView {
	/**
	 * @param {Canvas} canvas The canvas to use.
	 * @param {DOMRect} viewport The viewed region of the image.
	 * @param {Number} workerCount Number of background workers to use. Must be at least 1.
	 * @param {Number} chunkWidth Width of a single chunk of the processed image in pixels.
	 * @param {Number} chunkHeight Height of a single chunk of the processed image in pixels.
	 */
	constructor(canvas, viewport = undefined, workerCount = 10, chunkWidth = 64, chunkHeight = 64) {
		this.canvas = canvas;
		this.context = canvas.getContext('2d');
		this.chunkWidth = chunkWidth;
		this.chunkHeight = chunkHeight;
		if (viewport != null) {
			this.viewport = viewport;
		} else {
			if (this.canvas.width >= this.canvas.height) {
				let ratio = this.canvas.width / this.canvas.height;
				this.viewport = { x: -ratio, y: -1, width: 2*ratio, height: 2, };
			} else {
				let ratio = this.canvas.height / this.canvas.height;
				this.viewport = { x: -1, y: -ratio, width: 2, height: 2*ratio, };
			}
		}
		this.workers = [];
		this.nextWorkerIndex = 0;
		this.limit = 30;
		this.updateTimer = 0;
		this.offsetX = 0;
		this.offsetY = 0;

		for (var i = 0; i < workerCount; ++i) {
			this.workers.push(new Worker('./scripts/drawer.js'));
			this.workers[i].onmessage = (msg) => {
				if (msg.data.limit == this.limit
					&& msg.data.viewport.width == this.viewport.width
					&& msg.data.viewport.height == this.viewport.height
				) {
					this.context.putImageData(
						msg.data.image,
						msg.data.pixelX + this.offsetX - msg.data.offsetX,
						msg.data.pixelY + this.offsetY - msg.data.offsetY);
				}
			};
		}
	}

	/** Update part of the viewed image.
	 * @param {Number} limit Maximum number of iterations to use when drawing the image. 
	 * @param {DOMRect} rect The region of the image to redraw (in pixels). Defaults to the whole image if null.
	 */
	update(limit, rect = undefined) {
		if (rect == null) {
			rect = new DOMRect(0, 0, this.canvas.width, this.canvas.height);
		}

		if (this.limit != limit) {
			this.limit = limit;
		}

		let chunksX = rect.width / this.chunkWidth,
			chunksY = rect.height / this.chunkHeight;

		if (this.clearStyle != null) {
			this.context.fillStyle = this.clearStyle;
		}
		
		var message = {
				image: undefined,
				rect: {
					x: undefined, y: undefined,
					width: undefined, height: undefined,
				},
				limit: this.limit,
				viewport: this.viewport,
				offsetX: this.offsetX,
				offsetY: this.offsetY,
				pixelX: undefined,
				pixelY: undefined,
			};

		for (var y = 0; y < chunksY; ++y) {
			var height = Math.min(rect.height - y * this.chunkHeight, this.chunkHeight);

			message.pixelY = rect.y + y * this.chunkHeight;
			message.rect.y = this.viewport.y + (rect.y + y * this.chunkHeight) / this.canvas.height * this.viewport.height;
			message.rect.height = height / this.canvas.height * this.viewport.height;

			for (var x = 0; x < chunksX; ++x) {
				var width = Math.min(rect.width - x * this.chunkWidth, this.chunkWidth);

				message.pixelX = rect.x + x * this.chunkWidth;
				message.rect.x = this.viewport.x + (rect.x + x * this.chunkWidth) / this.canvas.width * this.viewport.width;
				message.rect.width = width / this.canvas.width * this.viewport.width;

				if (message.image == null || message.image.width != width || message.image.height != height) {
					message.image = this.context.createImageData(width, height);
				}

				this.workers[this.nextWorkerIndex].postMessage(message);
				this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.workers.length;
			}
		}
	}

	/** Reset the viewport to default state and redraw the image with provided limit.
	 * @param {Number} limit Maximum number of iterations to use when drawing the image.
	 */
	reset(limit) {
		if (this.canvas.width >= this.canvas.height) {
			let ratio = this.canvas.width / this.canvas.height;
			this.viewport = { x: -ratio, y: -1, width: 2*ratio, height: 2, };
		} else {
			let ratio = this.canvas.height / this.canvas.height;
			this.viewport = { x: -1, y: -ratio, width: 2, height: 2*ratio, };
		}
		this.update(limit);
	}

	/** Shift thee image provided number of pixels.
	 * @param {Number} x Horizontal number of pixels to shift the image by.
	 * @param {Number} y Vertical number of pixels to shift the image by.
	 */
	pan(x, y) {
		let midX = x >= 0 ? x : this.canvas.width + x,
			midY = y >= 0 ? y : this.canvas.height + y,
			quadrants = [];
		
		this.viewport.x -= x / this.canvas.width * this.viewport.width;
		this.viewport.y -= y / this.canvas.height * this.viewport.height;

		this.offsetX += x;
		this.offsetY += y;

		quadrants = [
			new DOMRect(0, 0, midX, midY),
			new DOMRect(midX, 0, canvas.width - midX, midY),
			new DOMRect(0, midY, midX, canvas.height - midY),
			new DOMRect(midX, midY, canvas.width - midX, canvas.height - midY),
		];

		// Remove the clean quadrant.
		if (x < 0 && y < 0) {
			let imageData = this.context.getImageData(-x, -y, quadrants[0].width, quadrants[0].height);
			this.context.putImageData(imageData, 0, 0);
			quadrants.splice(0, 1);
		} else if (x >= 0 && y < 0) {
			let imageData = this.context.getImageData(0, -y, quadrants[1].width, quadrants[1].height);
			this.context.putImageData(imageData, x, 0);
			quadrants.splice(1, 1);
		} else if (x < 0 && y >= 0) {
			let imageData = this.context.getImageData(-x, 0, quadrants[2].width, quadrants[2].height);
			this.context.putImageData(imageData, 0, y);
			quadrants.splice(2, 1);
		} else if (x >= 0 && y >= 0) {
			let imageData = this.context.getImageData(0, 0, quadrants[3].width, quadrants[3].height);
			this.context.putImageData(imageData, x, y);
			quadrants.splice(3, 1);
		}
	
		quadrants.forEach(quad => this.update(this.limit, quad));
	}

	/** Zoom the image in or out around a provided point.
	 * @param {Number} x The horizontal index of the pixel around which to zoom.
	 * @param {Number} y The vertical index of the pixel around which to zoom.
	 * @param {Number} scale The ratio by how much to zoom the picture.
	 * @param {Number} delay The number of milliseconds to wait before redrawing the image.
	 */
	zoom(x, y, scale, delay = 0) {
		let relX = x / this.canvas.width,
			relY = y / this.canvas.height,
			pointX = this.viewport.x + this.viewport.width * relX,
			pointY = this.viewport.y + this.viewport.height * relY;
		
		this.viewport.width *= scale;
		this.viewport.height *= scale;
		this.viewport.x = pointX - this.viewport.width * relX;
		this.viewport.y = pointY - this.viewport.height * relY;

		// Reuse the existent image while the workers are redrawing it.
		if (scale > 1) {
			let invScale = 1 / scale;
			this.context.drawImage(
				this.canvas,
				this.canvas.width * relX - this.canvas.width * relX * invScale,
				this.canvas.height * relY - this.canvas.height * relY * invScale,
				this.canvas.width * invScale,
				this.canvas.height * invScale);
		} else {
			this.context.drawImage(
				this.canvas,
				this.canvas.width * relX - this.canvas.width * relX * scale,
				this.canvas.height * relY - this.canvas.height * relY * scale,
				this.canvas.width * scale,
				this.canvas.height * scale,
				0,
				0,
				this.canvas.width,
				this.canvas.height);
		}

		window.clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(this.update.bind(this, this.limit), delay);
	}

	/** Resize the view.
	 * @param {Number} width The new width of the view in pixels.
	 * @param {Number} height The new height of the view in pixels.
	 */
	resize(width, height) {
		this.viewport.width *= width / this.canvas.width;
		this.viewport.height *= height / this.canvas.height;
		this.canvas.width = width;
		this.canvas.height = height;
		// The span is kept the same, allowing reuse of chunks
		this.update(this.limit);
	}
}
