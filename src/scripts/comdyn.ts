import { bindConfig, resetConfigs } from "./lib/draw_config"
import { DragEvent as DragGest, GestureDecoder, ZoomEvent as ZoomGest } from "./lib/gesture"
import { JuliaConfig, Renderer } from "./lib/irenderer"
import GpuRenderer from "./lib/gpu_renderer"
import HideMenu from "./lib/hidemenu"
import MandelMap from "./lib/mandelmap"

// Constants

const WHEEL_SENSITIVITY = 1e-3
const LOOPING_PERIOD = 120
const MANDEL_RADIUS = .7885

// Local variables

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const mapCanvas = document.getElementById('map') as HTMLCanvasElement
const map = new MandelMap(mapCanvas)
let renderer: Renderer = new GpuRenderer(canvas)
let lastX = 0, lastY = 0, lastScale = 0
let drawConfig: JuliaConfig = { limit: 32, escapeR: 2, seed: [0, 1] }
let speed = 1
let time = LOOPING_PERIOD / 4, lastAnimationTime = new Date().getTime()

// Function definitions

function draw() {
	renderer?.draw(drawConfig)
	map.draw(drawConfig.seed)
}

function animate() {
	if (!renderer)
		return

	const now = new Date().getTime()
	let dt = (now - lastAnimationTime) / 1_000
	lastAnimationTime = now
	time = (time + dt * speed) % LOOPING_PERIOD
	const nt = time / LOOPING_PERIOD * 2 * Math.PI
	drawConfig.seed = [MANDEL_RADIUS * Math.cos(nt), MANDEL_RADIUS * Math.sin(nt)]
	draw()
	if (speed > 0)
		requestAnimationFrame(animate)
}

function startAnimation() {
	lastAnimationTime = new Date().getTime()
	requestAnimationFrame(animate)
}

function selectPoint(coords: [number, number]) {
	drawConfig.seed = coords
	speed = 0
	requestAnimationFrame(draw)
}

function handleDrag(drag: DragGest) {
	if ((lastX != drag.x || lastY != drag.y) && renderer) {
		renderer.pan(drag.x - lastX, drag.y - lastY)
	}
	lastX = drag.x
	lastY = drag.y
}

function handleZoom(zoom: ZoomGest) {
	handleDrag(zoom)
	if (zoom.scale != lastScale && renderer) {
		renderer.zoom(zoom.x, zoom.y, lastScale / zoom.scale)
	}
	lastScale = zoom.scale
}


// Script logic

(() => {
	// resize canvas
	{
		canvas.width = window.innerWidth
		canvas.height = window.innerHeight
		const ratio = window.innerWidth / window.innerHeight
		renderer.resize(window.innerWidth, window.innerHeight)
		renderer.rect = new DOMRect(-ratio, -1, ratio * 2, 2)
		requestAnimationFrame(animate)
	}

	const gd = new GestureDecoder(canvas)
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

	map.onSelect = selectPoint

	canvas.addEventListener('wheel', event => {
		renderer?.zoom(event.clientX, event.clientY, 1 + event.deltaY * WHEEL_SENSITIVITY)
		event.preventDefault()
	})
	window.addEventListener('resize', () => renderer?.resize(window.innerWidth, window.innerHeight))

	new HideMenu(
		document.getElementById('hide-menu')!,
		document.getElementById('toggle-menu')!,
	)

	// Link configs
	{
		const limit = document.getElementById('limit') as HTMLInputElement
		drawConfig.limit = Number(limit.value)
		bindConfig(limit, value => {
			drawConfig.limit = value
			requestAnimationFrame(draw)
		})

		const escapeR = document.getElementById('escaper') as HTMLInputElement
		drawConfig.escapeR = Number(escapeR.value)
		bindConfig(escapeR, value => {
			drawConfig.escapeR = value
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
		document.getElementById('redraw')!.onclick = animate
		document.getElementById('reset')!.onclick = () => {
			resetConfigs()
			if (renderer) {
				const widthToHeight = canvas.width / canvas.height
				renderer.rect.y = -1
				renderer.rect.height = 2
				renderer.rect.x = -widthToHeight
				renderer.rect.width = widthToHeight * 2
			}
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
})()
