export default class DrawerMenu extends HTMLElement {
	readonly flap: HTMLElement;
	protected _normalSize = 0;
	protected _paddingSize = 0;

	constructor() {
		super();
		if (!(this.nextElementSibling instanceof HTMLButtonElement)) {
			throw 'Missing flap button element!';
		}
		this.flap = this.nextElementSibling;

		this._calculateNormalSize();
		window.addEventListener('resize', () => {
			const hide = this.isHidden;
			this.style.bottom = '';
			this.style.right = '';
			this.style.width = '';
			this.style.height = '';
			this._calculateNormalSize();
			this._stretchTo(hide ? 0 : this._normalSize, true);
		});

		this._setupFlap();
		this._stretchTo(0);
	}

	get isVertical(): boolean {
		return window.innerHeight >= window.innerWidth;
	}

	get isHidden(): boolean {
		return this._hiddenPixels * 2 >= this._normalSize;
	}

	set isHidden(value: boolean) {
		this._stretchTo(value ? 0 : this._normalSize, true);
	}

	protected get _hiddenPixels(): number {
		return (
			-Number.parseFloat(this.style.bottom.replace('px', '')) ||
			-Number.parseFloat(this.style.right.replace('px', '')) ||
			0
		);
	}

	protected _positionFlap() {
		if (this.isVertical) {
			const rotationAdjustment = this.flap.offsetHeight - 2 * this.flap.offsetWidth;
			this.flap.style.right = '';
			this.flap.style.bottom = `${this.clientHeight - this._hiddenPixels - rotationAdjustment}px`;
		} else {
			this.flap.style.bottom = '';
			this.flap.style.right = `${this.clientWidth - this._hiddenPixels}px`;
		}
	}

	protected _stretchTo(size: number, clamp = false) {
		if (clamp) {
			if (size * 2 >= this._normalSize) {
				size = this._normalSize;
			} else {
				size = 0;
			}
		}

		if (size >= this._normalSize) {
			if (this.isVertical) {
				this.style.height = `${size - this._paddingSize}px`;
				this.style.bottom = '0';
			} else {
				this.style.width = `${size - this._paddingSize}px`;
				this.style.right = '0';
			}
		} else {
			if (this.isVertical) {
				this.style.height = `${this._normalSize - this._paddingSize}px`;
				this.style.bottom = `${size - this.offsetHeight}px`;
			} else {
				this.style.width = `${this._normalSize - this._paddingSize}px`;
				this.style.right = `${size - this.offsetWidth}px`;
			}
		}
		this._positionFlap();
	}

	protected _setupFlap() {
		this.flap.draggable = true;
		let s: number;
        let p: number;
        let sp: number;
		this.flap.onpointerdown = (e) => {
			s = this._normalSize - this._hiddenPixels;
			p = this.isVertical ? e.y : e.x;
			sp = p;
			e.preventDefault();

			document.onpointermove = (e) => {
				const delta = this.isVertical ? e.y - p : e.x - p;
				this._stretchTo(s - delta);
				e.preventDefault();
			};

			document.onpointerup = (e) => {
				document.onpointerup = null;
				document.onpointermove = null;
				const sDelta = this.isVertical ? sp - e.y : sp - e.x;
				if (sDelta < 10) {
					this.isHidden = !this.isHidden;
				} else {
					const delta = this.isVertical ? e.y - p : e.x - p;
					this._stretchTo(s - delta, true);
				}
				e.preventDefault();
			};
		};
	}

	protected _calculateNormalSize() {
		// TODO: fetch padding programmatically
		if (this.isVertical) {
			this._paddingSize = 0;
			this._normalSize = this.clientHeight;
		} else {
			this._paddingSize = 0;
			this._normalSize = this.clientWidth;
		}
	}
}

customElements.define('drawer-menu', DrawerMenu);
