export default class SideMenu {
	public menu: HTMLElement;
	public button: HTMLElement;

	public constructor(
		menu: HTMLElement,
		button: HTMLElement,
	) {
		this.menu = menu;
		this.button = button;

		this.button.addEventListener('click', this.toggle.bind(this));
		this.open();
	}

	/** Open the side menu. */
	public open(): void {
		this.menu.style.transform = 'translate(0)';
	}

	/** Close the side menu. */
	public close(): void {
		this.menu.style.transform = `translate(100%)`;
	}

	/** Toggle between open and closed states. */
	public toggle(): void {
		if (this.menu.style.transform == 'translate(100%)') {
			this.open();
		} else {
			this.close();
		}
	}
}
