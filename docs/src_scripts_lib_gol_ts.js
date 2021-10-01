"use strict";
(self["webpackChunktechnomunk_github_io"] = self["webpackChunktechnomunk_github_io"] || []).push([["src_scripts_lib_gol_ts"],{

/***/ "./src/scripts/lib/gol.ts":
/*!********************************!*\
  !*** ./src/scripts/lib/gol.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var wasm_game_of_life_wasm_game_of_life__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! wasm-game-of-life/wasm_game_of_life */ "./wasm-game-of-life/pkg/wasm_game_of_life_bg.js");
/* harmony import */ var wasm_game_of_life_wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! wasm-game-of-life/wasm_game_of_life_bg.wasm */ "./wasm-game-of-life/pkg/wasm_game_of_life_bg.wasm");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util */ "./src/scripts/lib/util.ts");
/* eslint-disable @typescript-eslint/no-non-null-assertion */



const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext('2d');
const speedInput = document.getElementById("speed-select");
const speedText = document.getElementById("speed-indicator");
const pauseResumeButton = document.getElementById("pause-resume");
const pauseResumeIcon = pauseResumeButton.getElementsByTagName("img")[0];
const CELL_SIZE = 16; // px
const DELAYS = [2_000, 1_000, 500, 250, 100, 50, 10];
let cellCntX = Math.ceil(window.innerWidth / CELL_SIZE);
let cellCntY = Math.ceil(window.innerHeight / CELL_SIZE);
let delay = DELAYS[0];
let autostep = true;
const COL_LIVE = '#47BA00';
const COL_DEAD = '#D0D0D0';
const COL_GRID = '#000000';
canvas.width = cellCntX * CELL_SIZE;
canvas.height = cellCntY * CELL_SIZE;
let universe = wasm_game_of_life_wasm_game_of_life__WEBPACK_IMPORTED_MODULE_1__.Universe.random(cellCntX, cellCntY);
let redraw = 'full';
let lastDraw = Date.now();
window.addEventListener('resize', () => {
    cellCntX = Math.ceil(window.innerWidth / CELL_SIZE);
    cellCntY = Math.ceil(window.innerHeight / CELL_SIZE);
    canvas.width = cellCntX * CELL_SIZE;
    canvas.height = cellCntY * CELL_SIZE;
    universe.free();
    universe = wasm_game_of_life_wasm_game_of_life__WEBPACK_IMPORTED_MODULE_1__.Universe.random(cellCntX, cellCntY);
    redraw = 'full';
});
document.getElementById('step').onclick = stepSimulation;
canvas.addEventListener('click', event => {
    const canvasRect = canvas.getBoundingClientRect();
    const { x, y } = (0,_util__WEBPACK_IMPORTED_MODULE_0__.clientToRect)(event, canvasRect);
    if (event.ctrlKey || event.metaKey) {
        universe.spawn_glider(Math.floor(x * cellCntX), Math.floor(y * cellCntY));
    }
    else {
        universe.toggle(Math.floor(x * cellCntX), Math.floor(y * cellCntY));
    }
    redraw = 'cells';
});
window.addEventListener('keypress', event => {
    if (event.key == ' ') {
        stepSimulation();
    }
});
speedInput.min = "0";
speedInput.max = `${DELAYS.length - 1}`;
speedInput.oninput = updateDelay;
updateDelay();
pauseResumeButton.onclick = () => {
    autostep = !autostep;
    updatePausePlayIcon();
};
updatePausePlayIcon();
function updatePausePlayIcon() {
    if (autostep) {
        pauseResumeIcon.src = "images/pause.svg";
        pauseResumeIcon.alt = "pause";
    }
    else {
        pauseResumeIcon.src = "images/resume.svg";
        pauseResumeIcon.alt = "resume";
    }
}
function stepSimulation() {
    universe.tick();
    redraw = 'cells';
}
function updateDelay() {
    delay = DELAYS[+speedInput.value];
    speedText.textContent = `${1000 / delay}x`;
}
function drawGrid() {
    ctx.strokeStyle = COL_GRID;
    // Vertical lines.
    for (let x = 0; x <= cellCntX; ++x) {
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, CELL_SIZE * cellCntY);
    }
    // Horizontal lines.
    for (let y = 0; y <= cellCntY; ++y) {
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(CELL_SIZE * cellCntX, y * CELL_SIZE);
    }
    ctx.stroke();
}
function cellAlive(cells, x, y) {
    const idx = (y * cellCntX) + x;
    const byte = Math.floor(idx / 8);
    const mask = 1 << (idx % 8);
    return (cells[byte] & mask) === mask;
}
function drawCells() {
    const cells = new Uint8Array(wasm_game_of_life_wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_2__.memory.buffer, universe.cells_ptr(), universe.cells_size());
    ctx.beginPath();
    for (let y = 0; y < cellCntY; ++y) {
        for (let x = 0; x < cellCntX; ++x) {
            ctx.fillStyle = cellAlive(cells, x, y) ? COL_LIVE : COL_DEAD;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
        }
    }
    ctx.stroke();
}
function drawLoop() {
    const now = Date.now();
    if (autostep && ((now - lastDraw) >= delay)) {
        universe.tick();
        lastDraw = now;
        if (redraw != 'full') {
            redraw = 'cells';
        }
    }
    switch (redraw) {
        case 'full':
            drawGrid();
            drawCells();
            break;
        case 'cells':
            drawCells();
            break;
    }
    requestAnimationFrame(drawLoop);
}
drawLoop();


/***/ }),

/***/ "./src/scripts/lib/util.ts":
/*!*********************************!*\
  !*** ./src/scripts/lib/util.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "clientToRect": () => (/* binding */ clientToRect)
/* harmony export */ });
/** Transform client-relative coordinates to dom-relative coordinates.
 * @param client
 * @param rect
 * @returns relative position to the rect's origin in rect-space
 */
function clientToRect(client, rect) {
    const x = (client.x - rect.x) / rect.width;
    const y = (client.y - rect.y) / rect.height;
    return { x, y };
}


/***/ }),

/***/ "./wasm-game-of-life/pkg/wasm_game_of_life_bg.js":
/*!*******************************************************!*\
  !*** ./wasm-game-of-life/pkg/wasm_game_of_life_bg.js ***!
  \*******************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Universe": () => (/* binding */ Universe),
/* harmony export */   "__wbg_random_727732de4695ec15": () => (/* binding */ __wbg_random_727732de4695ec15),
/* harmony export */   "__wbindgen_throw": () => (/* binding */ __wbindgen_throw)
/* harmony export */ });
/* harmony import */ var _wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./wasm_game_of_life_bg.wasm */ "./wasm-game-of-life/pkg/wasm_game_of_life_bg.wasm");
/* module decorator */ module = __webpack_require__.hmd(module);


const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== _wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_0__.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(_wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_0__.memory.buffer);
    }
    return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function notDefined(what) { return () => { throw new Error(`${what} is not defined`); }; }
/**
*/
class Universe {

    static __wrap(ptr) {
        const obj = Object.create(Universe.prototype);
        obj.ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.ptr;
        this.ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        _wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_0__.__wbg_universe_free(ptr);
    }
    /**
    * Get the cell state at provided coordinates.
    *
    * True means 'alive', false means 'dead'.
    */
    tick() {
        _wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_0__.universe_tick(this.ptr);
    }
    /**
    * Create an empty universe.
    * @param {number} width
    * @param {number} height
    * @returns {Universe}
    */
    static empty(width, height) {
        var ret = _wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_0__.universe_empty(width, height);
        return Universe.__wrap(ret);
    }
    /**
    * Initialize a new universe with an interesting pattern.
    * @param {number} width
    * @param {number} height
    * @returns {Universe}
    */
    static random(width, height) {
        var ret = _wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_0__.universe_random(width, height);
        return Universe.__wrap(ret);
    }
    /**
    * Get the width of the universe in cells.
    * @returns {number}
    */
    width() {
        var ret = _wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_0__.universe_width(this.ptr);
        return ret >>> 0;
    }
    /**
    * Get the height of the universe in cells.
    * @returns {number}
    */
    height() {
        var ret = _wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_0__.universe_height(this.ptr);
        return ret >>> 0;
    }
    /**
    * Get the pointer to cell data in the universe.
    * @returns {number}
    */
    cells_ptr() {
        var ret = _wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_0__.universe_cells_ptr(this.ptr);
        return ret;
    }
    /**
    * @returns {number}
    */
    cells_size() {
        var ret = _wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_0__.universe_cells_size(this.ptr);
        return ret >>> 0;
    }
    /**
    * Toggle provided cell.
    * @param {number} x
    * @param {number} y
    */
    toggle(x, y) {
        _wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_0__.universe_toggle(this.ptr, x, y);
    }
    /**
    * Spawn a randomly transformed glider at provided coordinates.
    * @param {number} x
    * @param {number} y
    */
    spawn_glider(x, y) {
        _wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_0__.universe_spawn_glider(this.ptr, x, y);
    }
}

const __wbg_random_727732de4695ec15 = typeof Math.random == 'function' ? Math.random : notDefined('Math.random');

function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};



/***/ }),

/***/ "./wasm-game-of-life/pkg/wasm_game_of_life_bg.wasm":
/*!*********************************************************!*\
  !*** ./wasm-game-of-life/pkg/wasm_game_of_life_bg.wasm ***!
  \*********************************************************/
/***/ ((module, exports, __webpack_require__) => {

"use strict";
// Instantiate WebAssembly module
var wasmExports = __webpack_require__.w[module.id];
__webpack_require__.r(exports);
// export exports from WebAssembly module
for(var name in wasmExports) if(name) exports[name] = wasmExports[name];
// exec imports from WebAssembly module (for esm order)
/* harmony import */ var m0 = __webpack_require__(/*! ./wasm_game_of_life_bg.js */ "./wasm-game-of-life/pkg/wasm_game_of_life_bg.js");


// exec wasm module
wasmExports[""]()

/***/ })

}]);
//# sourceMappingURL=src_scripts_lib_gol_ts.js.map