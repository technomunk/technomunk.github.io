/** A complex number. */
export class Complex {
	re = 0;
	im = 0;
	
	/** Create a new complex number.
	 * @param {number} real Real part.
	 * @param {number} imaginary Imaginary (multiplied by sqrt(-1)) part.
	 */
	constructor(real: number, imaginary: number) {
		this.re = real;
		this.im = imaginary;
	}

	/** Add another complex number.
	 * @param {Complex} other The other complex number to add.
	 * @returns {this} Self.
	 */
	add(other: Complex): this {
		this.re += other.re;
		this.im += other.im;
		return this;
	}

	/** Multiply with itself.
	 * @returns {this} Self.
	 */
	sqr(): this {
		let re = this.re;
		let im = this.im;
		this.re = re*re - im*im;
		this.im = 2*re*im;
		return this;
	}

	/** Get the magnitude of the complex number.
	 * @returns {number} The magnitude of the number.
	 */
	mag2(): number {
		return this.re*this.re + this.im*this.im;
	}
}
