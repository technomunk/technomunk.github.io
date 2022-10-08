import("./lib/gol").catch(e => {
	console.trace(e);
	alert("Could not load Web-assembly 😢");
});
