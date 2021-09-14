/** Optional configuration for initialization of a SideMenu. */
interface SideMenuConfig {
	// The width of the opened menu in points.
	width?: number,
	// Maximum relative width of the whole viewport the menu may occupy.
	max_rel_width?: number,
}

export default class SideMenu {
	public static DEFAULT_WIDTH = 400;

	public menu: HTMLElement;
	public button: HTMLElement;

	private width: number = SideMenu.DEFAULT_WIDTH;
	private maxWidth?: number;

	public constructor(
		menu: HTMLElement,
		button: HTMLElement,
		config?: SideMenuConfig
	) {
		this.menu = menu;
		this.button = button;
		if (config != null) {
			this.width = config.width || SideMenu.DEFAULT_WIDTH;
			this.maxWidth = config.max_rel_width;
		}

		this.button.addEventListener('click', this.toggle.bind(this));
		this.close();
	}

	/** Open the side menu. */
	public open(): void {
		if (this.maxWidth != null && window.innerWidth * this.maxWidth < this.width) {
			this.menu.style.width = '100%';
		} else {
			this.menu.style.width = `${this.width}px`;
		}
	}

	/** Close the side menu. */
	public close(): void {
		this.menu.style.width = '0px';
	}

	/** Toggle between open and closed states. */
	public toggle(): void {
		if (this.menu.style.width === '0px') {
			this.open();
		} else {
			this.close();
		}
	}
}
