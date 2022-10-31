import { bindConfig, resetConfigs } from "./lib/draw_config"
import { DragEvent as DragGest, GestureDecoder, ZoomEvent as ZoomGest } from "./lib/gesture"
import { toggle } from "./lib/hide"
import JuliaView from "./lib/juliaview"
import MandelMap from "./lib/mandelmap"
import SlideMenu from "./lib/component/slidemenu"
import ViewRect from "./lib/viewrect"


customElements.define("julia-view", JuliaView, { extends: "canvas" })
customElements.define("slide-menu", SlideMenu, { extends: "aside" })

// Constants

const WHEEL_SENSITIVITY = 1e-3
const LOOPING_PERIOD = 120
const MANDEL_RADIUS = .7885

// Local variables

const mapCanvas = document.getElementById("map") as HTMLCanvasElement
const julia = document.getElementById("view-julia") as JuliaView
const map = new MandelMap(mapCanvas)
let lastX = 0, lastY = 0, lastScale = 0
let speed = 1
let time = LOOPING_PERIOD / 4, lastAnimationTime: DOMHighResTimeStamp = performance.now()

// Function definitions

function draw() {
	julia.draw()
	map.draw(julia.config.seed)
}

function animate(now: DOMHighResTimeStamp) {
	let dt = (now - lastAnimationTime) / 1_000
	lastAnimationTime = now
	time = (time + dt * speed) % LOOPING_PERIOD
	const nt = time / LOOPING_PERIOD * 2 * Math.PI
	julia.config.seed = [MANDEL_RADIUS * Math.cos(nt), MANDEL_RADIUS * Math.sin(nt)]
	draw()
	if (speed > 0)
		requestAnimationFrame(animate)
}

function startAnimation() {
	lastAnimationTime = performance.now()
	requestAnimationFrame(animate)
}

function selectPoint(coords: [number, number]) {
	julia.config.seed = coords
	speed = 0
	requestAnimationFrame(draw)
}

function handleDrag(drag: DragGest) {
	if (lastX != drag.x || lastY != drag.y) {
		julia.pan(drag.x - lastX, drag.y - lastY)
	}
	lastX = drag.x
	lastY = drag.y
}

function handleZoom(zoom: ZoomGest) {
	handleDrag(zoom)
	if (zoom.scale != lastScale) {
		const rect = julia.getBoundingClientRect()
		julia.zoom(zoom.x - rect.left, zoom.y - rect.top, lastScale / zoom.scale)
	}
	lastScale = zoom.scale
}


// Script logic

window.onload = () => {
	// resize canvas
	{
		julia.resize(window.innerWidth, window.innerHeight)
		const ratio = window.innerWidth / window.innerHeight
		julia.view = new ViewRect(0, 0, ratio * 2, 2)
		requestAnimationFrame(animate)
	}

	{
		const menuToggle = document.getElementById("toggle-menu")
		const menu = document.getElementById("menu")
		if (menuToggle && menu) {
			menuToggle.addEventListener("click", () => toggle(menu))
		}
	}

	const gd = new GestureDecoder(julia)
	gd.on('dragstart', drag => {
		lastX = drag.x
		lastY = drag.y
	})
	gd.on('dragupdate', handleDrag)
	gd.on('dragstop', handleDrag)

	gd.on('zoomstart', zoom => {
		lastX = zoom.x
		lastY = zoom.y
		lastScale = zoom.scale
	})
	gd.on('zoomupdate', handleZoom)
	gd.on('zoomstop', handleZoom)
	// gd.on('tap', () => speed = 0)

	map.onSelect = selectPoint

	julia.addEventListener('wheel', event => {
		const rect = julia.getBoundingClientRect()
		const x = event.clientX - rect.left
		const y = event.clientY - rect.top
		julia.zoom(x, y, 1 + event.deltaY * WHEEL_SENSITIVITY)
		event.preventDefault()
	})
	window.addEventListener('resize', () => julia.resize(window.innerWidth, window.innerHeight))

	// Link configs
	{
		const limit = document.getElementById('limit') as HTMLInputElement
		julia.config.limit = Number(limit.value)
		bindConfig(limit, value => {
			julia.config.limit = value
			requestAnimationFrame(draw)
		})
	}

	// Setup fullscreen toggle button
	{
		const button = document.getElementById("toggle_fs") as HTMLButtonElement
		if (document.fullscreenEnabled) {
			button.onclick = () => {
				if (document.fullscreenElement) {
					document.exitFullscreen()
				} else {
					document.documentElement.requestFullscreen()
				}
			}
		} else {
			button.remove()
		}
	}

	// Setup redraw and reset buttons
	{
		document.getElementById('redraw')!.onclick = draw
		document.getElementById('reset')!.onclick = () => {
			resetConfigs()
			const widthToHeight = julia.width / julia.height
			julia.view.y = 0
			julia.view.x = 0
			julia.view.height = 2
			julia.view.width = widthToHeight * 2
		}
	}

	// Setup pause/resume key
	{
		const speedElement = document.getElementById("speed") as HTMLInputElement
		speed = Number(speedElement.value)
		bindConfig(speedElement, value => {
			const restart = speed == 0
			speed = value * value
			if (restart && speed != 0)
				startAnimation()
		})
		document.addEventListener("keypress", e => {
			if (e.key == " ") {
				if (speed == 0) {
					const value = Number(speedElement.value)
					speed = value * value
					startAnimation()
				} else {
					speed = 0
				}
			}
		})
	}
}
