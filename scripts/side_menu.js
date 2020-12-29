'strict mode';

(function(){

// Constants

const MENU_WIDTH = 200;
const TOGGLE_BUTTON_MARGIN = 20;

// Global variables

let sideMenu = document.getElementById('side-menu');
let toggleButton = document.getElementById('toggle-menu');
let arrow = document.getElementById('toggle-menu-arrow');

// Free functions

/** Open the side menu of the document. */
function openSideMenu() {
	var sideMenuWidth = 0;

	sideMenu.style.width = `${MENU_WIDTH}pt`;
	sideMenuWidth = sideMenu.getBoundingClientRect().width;
	toggleButton.style.marginRight = `${MENU_WIDTH + TOGGLE_BUTTON_MARGIN}pt`;
	arrow.classList.remove('left');
	arrow.classList.add('right');
}

/** Close the side menu of the document. */
function closeSideMenu() {
	sideMenu.style.width = 0;
	toggleButton.style.marginRight = `${TOGGLE_BUTTON_MARGIN}pt`;
	arrow.classList.remove('right');
	arrow.classList.add('left');
}

/** Open the side menu of the document if it's closed or close it if it's open. */
function toggleSideMenu() {
	if (sideMenu.style.width === `${MENU_WIDTH}pt`) {
		closeSideMenu();
	} else {
		openSideMenu();
	}
}

// Register events

toggleButton.addEventListener('click', toggleSideMenu);

}());
