let button = document.getElementById("toggle_fs")!;
if (document.fullscreenEnabled) {
	button.onclick = () => {
		if (document.fullscreenElement) {
			document.exitFullscreen();
		} else {
			document.documentElement.requestFullscreen();
		}
	};
} else {
	button.remove();
}
