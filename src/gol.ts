/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Universe } from "wasm-game-of-life/wasm_game_of_life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg.wasm";

const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const CELL_SIZE = 16; // px

const cellCntX = Math.floor(window.innerWidth / CELL_SIZE),
cellCntY = Math.floor(window.innerHeight / CELL_SIZE);

const COL_LIVE = '#000000';
const COL_DEAD = '#FFFFFF';
const COL_GRID = '#CCCCCC';

canvas.width = cellCntX * CELL_SIZE;
canvas.height = cellCntY * CELL_SIZE;

const universe = Universe.random(cellCntX, cellCntY);

function drawGrid() {
	ctx.strokeStyle = COL_GRID;
	
	// Vertical lines.
	for (let x = 0; x <= cellCntX; ++x) {
		ctx.moveTo(x * (CELL_SIZE + 1) + 1, 0);
		ctx.lineTo(x * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * cellCntY + 1);
	}

	// Horizontal lines.
	for (let y = 0; y <= cellCntY; ++y) {
		ctx.moveTo(0, y * (CELL_SIZE + 1) + 1);
		ctx.lineTo((CELL_SIZE + 1) * cellCntX + 1, y * (CELL_SIZE + 1) + 1);
	}

	ctx.stroke();
}

function cellAlive(cells: Uint8Array, x: number, y: number): boolean {
	const idx = (y * cellCntX) + x;
	const byte = Math.floor(idx / 8);
	const mask = 1 << (idx % 8);
	return (cells[byte] & mask) === mask;
}

function drawCells() {
	universe.tick();
	const cells = new Uint8Array(memory.buffer, universe.cells_ptr(), universe.cells_size());
  
	ctx.beginPath();
  
	for (let y = 0; y < cellCntY; ++y) {
		for (let x = 0; x < cellCntX; ++x) {  
			ctx.fillStyle = cellAlive(cells, x, y) ? COL_LIVE : COL_DEAD;
  
			ctx.fillRect(
				x * (CELL_SIZE + 1) + 1,
				y * (CELL_SIZE + 1) + 1,
				CELL_SIZE,
				CELL_SIZE
			);
		}
	}
  
	ctx.stroke();
}

drawGrid();
drawCells();
