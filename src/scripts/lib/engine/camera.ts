import { mat4, vec3 } from 'gl-matrix';
import type { Vec3 } from './types';

export abstract class Camera {
	abstract calcRight(position: Vec3): vec3;
	abstract calcView(position: Vec3, result?: mat4): mat4;
	abstract calcProjection(widthToHeight: number, result?: mat4): mat4;
}

export class PerspectiveCamera extends Camera {
	readonly target: Vec3;
	readonly verticalFov: number;
	near: number;
	far: number;

	constructor(
		target: Vec3 = [0, 0, 0],
		verticalFov: number = Math.PI / 2,
		near = 0.01,
		far = 10,
	) {
		super();
		this.target = target;
		this.verticalFov = verticalFov;
		this.near = near;
		this.far = far;
	}

	calcRight(position: Vec3): vec3 {
		const result = vec3.create();
		return vec3.normalize(
			result,
			vec3.cross(result, vec3.sub(result, this.target, position), [0, 1, 0]),
		);
	}

	calcView(position: Vec3, result?: mat4): mat4 {
		result = result || mat4.create();
		return mat4.lookAt(result, position, this.target, [0, 1, 0]);
	}

	calcProjection(widthToHeight: number, result?: mat4): mat4 {
		result = result || mat4.create();
		return mat4.perspective(result, this.verticalFov, widthToHeight, this.near, this.far);
	}
}
