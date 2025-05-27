import type { Entity, World } from './entity';
import type { System } from './types';

export class Loop {
	protected _isRunning = false;
	protected _lastTime = performance.now();
	protected _animationFrame = 0;

	constructor(
		public readonly world: World<Entity>,
		public systems: System[],
	) {
		for (const system of systems) {
			if (system.setup) system.setup(this.world);
		}
	}

	runSystems() {
		const now = performance.now();
		const dt = (now - this._lastTime) / 1_000;
		for (const system of this.systems) {
			system.run(this.world, dt);
		}
		this._lastTime = now;
	}

	get isRunning() {
		return this._isRunning;
	}
	set isRunning(value: boolean) {
		if (this._isRunning === value) return;
		this._isRunning = value;
		if (value) {
			this.loop();
		} else {
			cancelAnimationFrame(this._animationFrame);
		}
	}

	loop() {
		this._animationFrame = requestAnimationFrame(() => {
			if (!this.isRunning) return;
			this.runSystems();
			this.loop();
		});
	}
}
