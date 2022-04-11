import("./lib/p2ds").catch(e => {
	// Bevy throws an exception that isn't an actual exception
	if (e.toString().indexOf("This isn't actually an error") != -1)
		return;
	console.trace(e);
	alert("Could not load Web-assembly 😢");
});
