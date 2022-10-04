export default class HideMenu extends HTMLElement {
	public constructor() {
		super()
		const button = document.getElementById("toggle-menu")
		if (button) {
			button.addEventListener("click", this.toggle.bind(this))
		}
		this.hide()
	}

	/** Open the side menu. */
	public show() {
		this.classList.remove("hidden")
	}

	/** Close the side menu. */
	public hide() {
		this.classList.add("hidden")
	}

	/** Toggle between open and closed states. */
	public toggle() {
		if (this.classList.contains("hidden")) {
			this.show()
		} else {
			this.hide()
		}
	}
}
