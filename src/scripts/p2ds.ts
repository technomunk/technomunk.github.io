import("./lib/p2ds").catch(e => {
	console.error("Error import gol");
	console.trace(e);
	alert("Could not load Web-assembly 😢");
});
