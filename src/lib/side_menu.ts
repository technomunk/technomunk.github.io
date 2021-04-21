/** Optional configuration for initialization of a SideMenu. */
interface SideMenuConfig {
	// The width of the opened menu in points.
	width?: number,
	// The margin between the opened menu and the button in points.
	margin?: number,
}

export default class SideMenu {
	public static DEFAULT_WIDTH = 300;
	public static DEFAULT_MARGIN = 20;

	public menu: HTMLElement;
	public button: HTMLElement;

	private width: number = SideMenu.DEFAULT_WIDTH;
	private margin: number = SideMenu.DEFAULT_MARGIN;

	public constructor(
		menu: HTMLElement,
		button: HTMLElement,
		config?: SideMenuConfig
	) {
		this.menu = menu;
		this.button = button;
		if (config != null) {
			this.width = config.width || SideMenu.DEFAULT_WIDTH;
			this.margin = config.margin || SideMenu.DEFAULT_MARGIN;
		}

		this.button.addEventListener('click', this.toggle.bind(this));
	}

	/** Open the side menu. */
	public open() {
		this.menu.style.width = `${this.width}pt`;
		this.button.style.marginRight = `${this.width + this.margin}pt`;
		// TODO: animate button
	}

	/** Close the side menu. */
	public close() {
		this.menu.style.width = '0';
		this.button.style.marginRight = `${this.margin}pt`;
		// TODO: animate button
	}

	/** Toggle between open and closed states. */
	public toggle() {
		if (this.menu.style.width === `${this.width}pt`) {
			this.close();
		} else {
			this.open();
		}
	}
}
