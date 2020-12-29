'use strict';

(function(){

// Constants

const SIXTH = 1 / 6;

// Class declarations

/** A complex number. */
class Complex {
	re = 0;
	im = 0;
	
	/** Create a new complex number.
	 * @param {Number} real Real part.
	 * @param {Number} imaginary Imaginary (multiplied by sqrt(-1)) part.
	 */
	constructor(real, imaginary) {
		this.re = real;
		this.im = imaginary;
	}

	/** Add another complex number.
	 * @param {Complex} other The other complex number to add.
	 * @returns {Complex} Self.
	 */
	add(other) {
		this.re += other.re;
		this.im += other.im;
		return this;
	}

	/** Multiply with itself.
	 * @returns {Complex} Self.
	 */
	sqr() {
		let re = this.re;
		let im = this.im;
		this.re = re*re - im*im;
		this.im = 2*re*im;
		return this;
	}

	/** Get the magnitude of the complex number.
	 * @returns {Number} The magnitude of the number.
	 */
	mag2() {
		return this.re*this.re + this.im*this.im;
	}
}

// Free function declarations

/** Check whether the provided point is within the Mandelbrot set.
 * See https://en.wikipedia.org/wiki/Mandelbrot_set for more details.
 * @param {Complex} point The complex number to check.
 * @param {Number} limit Maximum number of iterations to check whether the number is within the Mandelbrot set.
 * @returns {[Number, Complex]} Number of iterations the number passed and the last checked value.
 */
function mandelbrot(point, limit) {
	let c = {...point};
	var i = 0;
	for (i = 0; i < limit; ++i) {
		if (point.mag2() > 4) {
			return [ i, point, ];
		}
		point.sqr().add(c);
	}
	return [ i, point, ];
}

/** Translate a hue value to a fully saturated RGB value using
 * https://www.rapidtables.com/convert/color/hsv-to-rgb.html
 * @param {Number} hue Normalized hue of HSV color.
 * @returns {[Number]} [red, green, blue] color.
 */
function hueToRgb(hue) {
	if (hue < SIXTH) {
		return [ 255, hue / SIXTH * 255, 0, ];
	} else if (hue < 2*SIXTH) {
		return [ (2 - hue/SIXTH) * 255, 255, 0, ];
	} else if (hue < 3*SIXTH) {
		return [ 0, 255, (hue - 2*SIXTH) / SIXTH * 255, ];
	} else if (hue < 4*SIXTH) {
		return [ 0, (2 - (hue - 2*SIXTH) / SIXTH) * 255, 255, ];
	} else if (hue < 5*SIXTH) {
		return [ (hue - 4*SIXTH) / SIXTH * 255, 0, 255, ];
	} else {
		return [ 255, 0, (2 - (hue - 4*SIXTH)/SIXTH) * 255, ];
	}
}

/** Map iteration count to an RGB value.
 * @param {Number} iterationCount The number of performed iterations for the pixel.
 * @param {Number} limit The maximum number of iterations to perform.
 * @returns {[Number]} RGB values of the mapped color.
 */
function mapColor(iterationCount, limit) {
	if (iterationCount === limit) {
		return [ 0, 0, 0, ];
	}
	return hueToRgb(iterationCount / limit);
}

/** Draw part of the mandelbrot set as provided by the thing.
 * Posts a message with the image and the provided rectangle back when done.
 * @param {ImageData} image The image to draw to.
 * @param {DOMRect} rect The rectangle to draw.
 * @param {Number} limit The maximum number of iterations to perform.
 */
function draw(image, rect, limit) {
	let pixels = image.data;
	
	var offset = 0,
		xCoord = 0,
		yCoord = 0,
		pixel = [],
		x = 0,
		y = 0,
		result = [];

	for (y = 0; y < image.height; ++y) {
		yCoord = rect.y + rect.height * y / image.height;
		for (x = 0; x < image.width; ++x) {
			xCoord = rect.x + rect.width * x / image.width;
			result = mandelbrot(new Complex(xCoord, yCoord), limit);
			pixel = mapColor(result[0], limit);
			pixels[offset++] = pixel[0]; // red
			pixels[offset++] = pixel[1]; // green
			pixels[offset++] = pixel[2]; // blue
			pixels[offset++] = 255; // alpha
		}
	}
}

onmessage = function (msg) {
	draw(msg.data.image, msg.data.rect, msg.data.limit);
	postMessage(msg.data);
};

}());
