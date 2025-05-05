import { error } from '@lib/util';
import FragmentRenderer from '@lib/webgl/fragment';
import { ViewRect, CanvasViewAdapter } from '@lib/webgl/view';
import { Ref, SERIALIZER_INTEGER } from '@lib/ref';

import JULIA_SHADER from '@shader/julia.fs';
import MANDELBROT_SHADER from '@shader/mandelbrot.fs';

const MANDELBROT_CONTEXT_SETTINGS: CanvasRenderingContext2DSettings = {
	alpha: false,
	desynchronized: true,
	willReadFrequently: false,
};

type JuliaConfig = {
	limit: Ref<number>;
	seed: [number, number];
};

class JuliaRenderer {
	readonly renderer: FragmentRenderer;
	readonly adapter: CanvasViewAdapter<HTMLCanvasElement>;

	constructor(canvas: HTMLCanvasElement) {
		this.renderer = new FragmentRenderer(canvas);
		this.renderer.setShader(JULIA_SHADER);
		this.adapter = new CanvasViewAdapter(new ViewRect(0, 0, 2.0, 2.0), canvas);
	}

	get view(): ViewRect {
		return this.adapter.view;
	}
	get canvas(): HTMLCanvasElement {
		return this.adapter.canvas;
	}

	draw(config: JuliaConfig) {
		this.renderer.draw({
			uPos: [this.view.minX, this.view.minY],
			uStep: [this.view.width / this.canvas.width, this.view.height / this.canvas.height],
			uLim: config.limit.value,
			uSeed: config.seed,
		});
	}

	resize(width: number, height: number) {
		this.adapter.resizeCanvas(width, height);
		this.renderer.updateSize();
	}
}

class MandelbrotView {
	readonly canvas: HTMLCanvasElement;
	readonly context: CanvasRenderingContext2D;
	readonly background: CanvasImageSource;
	readonly view: ViewRect = new ViewRect(-0.5, 0, 3.3, 2.2);
	targetSize = 10;
	targetStyle = 'red';
	protected _selectOnMove = false;
	protected _target: [number, number] = [0.5, 0.5];
	protected _observers: Array<(point: [number, number]) => void> = [];

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.context =
			this.canvas.getContext('2d', MANDELBROT_CONTEXT_SETTINGS) ?? error('Failed to get mandelbrot rendering context');
		this.background = new OffscreenCanvas(canvas.width, canvas.height);
		const renderer = new FragmentRenderer(this.background);
		renderer.drawWithShader(MANDELBROT_SHADER, {
			uLim: 32,
			uPos: [this.view.minX, this.view.minY],
			uStep: [this.view.width / canvas.width, this.view.height / canvas.height],
		});
		this._setupSelection();
	}

	draw() {
		this.context.drawImage(this.background, 0, 0);
		this._drawTarget();
	}

	addObserver(observer: (point: [number, number]) => void) {
		this._observers.push(observer);
	}

	get target(): [number, number] {
		return this.view.relativeToActual(...this._target);
	}
	set target(value: [number, number]) {
		this._target = this.view.actualToRelative(...value);
	}

	protected _drawTarget() {
		const centerX = this.canvas.width * this._target[0];
		const centerY = this.canvas.height * this._target[1];
		const halfSize = this.targetSize / 2;
		this.context.strokeStyle = this.targetStyle;
		this.context.beginPath();
		this.context.moveTo(centerX - halfSize, centerY);
		this.context.lineTo(centerX + halfSize, centerY);
		this.context.moveTo(centerX, centerY - halfSize);
		this.context.lineTo(centerX, centerY + halfSize);
		this.context.stroke();
	}

	protected _setupSelection() {
		this.canvas.addEventListener('pointerdown', (event) => {
			this._selectOnMove = true;
			this._select(event.offsetX, event.offsetY);
		});
		this.canvas.addEventListener('pointermove', (event) => {
			if (this._selectOnMove) {
				this._select(event.offsetX, event.offsetY);
			}
		});
		const cancelSelection = () => {
			this._selectOnMove = false;
		};
		this.canvas.addEventListener('pointerleave', cancelSelection);
		this.canvas.addEventListener('pointercancel', cancelSelection);
		this.canvas.addEventListener('pointerout', cancelSelection);
		this.canvas.addEventListener('pointerup', cancelSelection);
	}

	protected _select(x: number, y: number) {
		const point = this.view.relativeToActual(x / this.canvas.width, 1 - y / this.canvas.height);
		this.target = point;
		this._informObserversOfSelection(point);
	}

	protected _informObserversOfSelection(point: [number, number]) {
		for (const observer of this._observers) {
			observer(point);
		}
	}
}

class JuliaView extends HTMLCanvasElement {
	readonly renderer: JuliaRenderer;
	readonly config: JuliaConfig = { limit: new Ref(32), seed: [0, 0.7885] };

	constructor() {
		super();

		this.renderer = new JuliaRenderer(this);

		this._setup();
	}

	drawFrame() {
		this.renderer.draw(this.config);
	}

	protected _setup() {
		this.updateViewRatio();
		this.config.limit.addObserver(() => this.drawFrame());
	}

	updateViewRatio() {
		const ratio = this.width / this.height;
		this.renderer.view.width = ratio * this.renderer.view.height;
	}
}

class JuliaWithMandelbrotMap {
	readonly julia: JuliaView;
	readonly mandelbrot: MandelbrotView;

	constructor(julia: JuliaView, mandelbrot: HTMLCanvasElement) {
		this.julia = julia;
		this.mandelbrot = new MandelbrotView(mandelbrot);
		this._setupMandelbrotObservation();
	}

	drawFrame() {
		this.julia.drawFrame();
		this.mandelbrot.draw();
	}

	requestFrame() {
		requestAnimationFrame(() => this.drawFrame());
	}

	resizeAndDraw(width: number, height: number) {
		this.julia.renderer.resize(width, height);
		this.requestFrame();
	}

	setJuliaPoint(point: [number, number]) {
		this.mandelbrot.target = point;
		this._setJuliaViewToPoint(point);
	}

	protected _setupMandelbrotObservation() {
		this.mandelbrot.addObserver(this._setJuliaViewToPoint.bind(this));
	}

	protected _setJuliaViewToPoint(point: [number, number]) {
		console.debug(point);
		this.mandelbrot.draw();
		this.julia.config.seed = point;
		this.requestFrame();
	}
}

class JuliaAnimator {
	readonly representation: JuliaWithMandelbrotMap;

	orbitFocus: [number, number] = [-1, 0];
	orbitRadius = 0.275;
	orbitPeriodMS = 60_000;

	protected _isPlaying = false;
	protected _animationStartTime = 0;

	constructor(representation: JuliaWithMandelbrotMap) {
		this.representation = representation;
	}

	get isPlaying(): boolean {
		return this._isPlaying;
	}
	set isPlaying(value: boolean) {
		if (value === this._isPlaying) {
			return;
		}
		value ? this.start() : this.stop();
	}

	/** Begin playing animation */
	start() {
		if (this._isPlaying) {
			return;
		}

		this._isPlaying = true;
		this._animationStartTime = performance.now();
		this._drawFrame();
	}

	stop() {
		this._isPlaying = false;
	}

	protected _drawFrame() {
		if (!this._isPlaying) {
			return;
		}
		const dt = performance.now() - this._animationStartTime;
		const periodTime = (dt % this.orbitPeriodMS) / this.orbitPeriodMS;
		const angle = periodTime * Math.PI * 2;
		const x = this.orbitFocus[0] + this.orbitRadius * Math.cos(angle);
		const y = this.orbitFocus[1] + this.orbitRadius * Math.sin(angle);

		this.representation.setJuliaPoint([x, y]);
		requestAnimationFrame(() => this._drawFrame());
	}
}

function setup() {
	const julia = document.querySelector('#view-julia') as JuliaView;
	julia.renderer.resize(window.innerWidth, window.innerHeight);
	julia.renderer.view.height = 2;
	julia.updateViewRatio();

	julia.config.limit.bindToInput('input#limit', SERIALIZER_INTEGER);

	const mandelbrot = document.querySelector('canvas#map') as HTMLCanvasElement;
	const adapter = new JuliaWithMandelbrotMap(julia, mandelbrot);
	const animator = new JuliaAnimator(adapter);

	adapter.mandelbrot.addObserver(() => animator.stop());

	window.addEventListener('resize', () => adapter.resizeAndDraw(window.innerWidth, window.innerHeight));
	adapter.requestFrame();
	animator.start();

	setupButton(animator);
}

function setupButton(animator: JuliaAnimator) {
	const button = document.querySelector('button#start-stop') as HTMLButtonElement;
	button.addEventListener('click', () => {
		animator.isPlaying = !animator.isPlaying;
		button.textContent = animator.isPlaying ? 'Stop' : 'Start';
	});
	button.textContent = animator.isPlaying ? 'Stop' : 'Start';
	animator.representation.mandelbrot.addObserver(() => {
		button.textContent = 'Start';
	});
}

// bindFnToButton("button#toggle_fs", toggleFullScreen)
customElements.define('julia-view', JuliaView, { extends: 'canvas' });
window.addEventListener('load', setup, { once: true });
