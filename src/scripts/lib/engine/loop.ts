import type { Entity, World } from './entity';
import type { System } from './types';

export class Loop {
	protected _lastTime = performance.now();

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

	loop() {
		requestAnimationFrame(() => {
			this.runSystems();
			this.loop();
		});
	}
}
