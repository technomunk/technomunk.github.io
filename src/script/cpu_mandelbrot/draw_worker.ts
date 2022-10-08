// Constants

const SIXTH = 1 / 6;
const LOG_2 = Math.log(2);

// Free function declarations

interface MandelbrotConfig {
	limit: number,
	escapeRadius: number,
}

/** Check whether the provided point is within the Mandelbrot set.
 * See https://en.wikipedia.org/wiki/Mandelbrot_set for more details.
 * @param {number} re real part of the number to check.
 * @param {number} im imaginary part of the number to check.
 * @param {MandelbrotConfig} config Configuration to use.
 * @returns {[number, [number, number]]} iterations the number passed and the values of the final iteration.
 */
function mandelbrot(re: number, im: number, config: MandelbrotConfig): [number, [number, number]] {
	let r2 = config.escapeRadius * config.escapeRadius;
	var i = 0,
		x = 0,
		x2 = 0,
		y = 0,
		y2 = 0;
	while ((x2 + y2 < r2) && (i < config.limit)) {
		y = 2 * x * y + im;
		x = x2 - y2 + re;
		x2 = x * x;
		y2 = y * y;
		++i;
	}
	return [i, [x, y]];
}

/** Translate a hue value to a fully saturated RGB value using
 * https://www.rapidtables.com/convert/color/hsv-to-rgb.html
 * @param {number} hue Normalized hue of HSV color.
 * @returns {[number, number, number]} [red, green, blue] color.
 */
function hueToRgb(hue: number): [number, number, number] {
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

/** Get the continuous iteration number for a complex number approximation.
 * @see https://en.wikipedia.org/wiki/Julia_set#The_potential_function_and_the_real_iteration_number
 * @param re real part of the complex number.
 * @param im imaginary part of the complex number.
 */
function potential(re: number, im: number): number {
	let logZn = Math.log(re*re + im*im) / 2;
	return 1 - Math.log(logZn / LOG_2) / LOG_2;
}

/** Map iteration count to an RGB value.
 * @param {number} iterationCount The number of performed iterations for the pixel.
 * @param {number} limit The maximum number of iterations to perform.
 * @param {number} value The value of the last checked complex number.
 * @returns {[number, number, number]} RGB values of the mapped color.
 */
function mapColor(iterationCount: number, limit: number): [number, number, number] {
	if (iterationCount === limit) {
		return [ 0, 0, 0, ];
	}
	return hueToRgb(iterationCount / limit);
}

/** Draw part of the mandelbrot set as provided by the thing.
 * Posts a message with the image and the provided rectangle back when done.
 * @param {ImageData} image The image to draw to.
 * @param {DOMRect} rect The rectangle to draw.
 * @param {DrawConfig} config The configuration to use when drawing the image.
 */
function draw(image: ImageData, rect: DOMRect, config: DrawConfig): void {
	let pixels = image.data;
	
	var offset = 0,
		xCoord = 0,
		yCoord = 0,
		pixel: [number, number, number] = [0, 0, 0],
		x = 0,
		y = 0,
		result = 0,
		re = 0,
		im = 0;

	for (y = 0; y < image.height; ++y) {
		yCoord = rect.y + rect.height * y / image.height;
		for (x = 0; x < image.width; ++x) {
			xCoord = rect.x + rect.width * x / image.width;
			[result, [re, im]] = mandelbrot(xCoord, yCoord, config);
			pixel = mapColor(result, config.limit);
			pixels[offset++] = pixel[0]; // red
			pixels[offset++] = pixel[1]; // green
			pixels[offset++] = pixel[2]; // blue
			pixels[offset++] = 255; // alpha
		}
	}
}

onmessage = (msg: MessageEvent<DrawRegionMessage>) => {
	let image = new ImageData(
		new Uint8ClampedArray(msg.data.pixels),
		msg.data.width,
		msg.data.height);
	draw(image, msg.data.rect, msg.data.config);
	postMessage(msg.data, [msg.data.pixels]);
};
