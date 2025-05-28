import { clamp, error } from './util';

export function makeSVGMovable(element: SVGGeometryElement, callback?: () => void) {
	element.style.touchAction = 'none';
	let dragPointerId: number | null = null;

	element.addEventListener('pointerdown', (event) => {
		event.preventDefault();
		if (dragPointerId == null) {
			dragPointerId = event.pointerId;
			element.setPointerCapture(event.pointerId);
			element.classList.add('dragging');
		}
	});

	element.addEventListener('pointerup', (event) => {
		if (dragPointerId === event.pointerId) {
			event.preventDefault();
			element.classList.remove('dragging');
			callback?.();
			dragPointerId = null;
		}
	});

	element.addEventListener('pointermove', (event) => {
		event.preventDefault();
		if (dragPointerId === event.pointerId) {
			let [x, y] = getPointerPos(event, element);
			x = clamp(x);
			y = clamp(y);
			element.setAttribute('cx', x.toString());
			element.setAttribute('cy', y.toString());
			callback?.();
		}
	});
}

function getPointerPos(event: MouseEvent, svg: SVGGeometryElement): [number, number] {
	const rootSvg = svg.ownerSVGElement ?? error('Could not find owner SVG element');
	return [event.offsetX / rootSvg.clientWidth, event.offsetY / rootSvg.clientHeight];
}
