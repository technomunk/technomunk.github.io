"use strict";
(self["webpackChunktechnomunk_github_io"] = self["webpackChunktechnomunk_github_io"] || []).push([["src_gol_ts"],{

/***/ "./src/gol.ts":
/*!********************!*\
  !*** ./src/gol.ts ***!
  \********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var wasm_game_of_life_wasm_game_of_life__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! wasm-game-of-life/wasm_game_of_life */ "./wasm-game-of-life/pkg/wasm_game_of_life_bg.js");
/* harmony import */ var wasm_game_of_life_wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! wasm-game-of-life/wasm_game_of_life_bg.wasm */ "./wasm-game-of-life/pkg/wasm_game_of_life_bg.wasm");
/* eslint-disable @typescript-eslint/no-non-null-assertion */


const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext('2d');
const CELL_SIZE = 16; // px
const cellCntX = Math.floor(window.innerWidth / CELL_SIZE), cellCntY = Math.floor(window.innerHeight / CELL_SIZE);
const COL_LIVE = '#000000';
const COL_DEAD = '#FFFFFF';
const COL_GRID = '#CCCCCC';
canvas.width = cellCntX * CELL_SIZE;
canvas.height = cellCntY * CELL_SIZE;
const universe = wasm_game_of_life_wasm_game_of_life__WEBPACK_IMPORTED_MODULE_0__.Universe.random(cellCntX, cellCntY);
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
function cellAlive(cells, x, y) {
    const idx = (y * cellCntX) + x;
    const byte = Math.floor(idx / 8);
    const mask = 1 << (idx % 8);
    return (cells[byte] & mask) === mask;
}
function drawCells() {
    universe.tick();
    const cells = new Uint8Array(wasm_game_of_life_wasm_game_of_life_bg_wasm__WEBPACK_IMPORTED_MODULE_1__.memory.buffer, universe.cells_ptr(), universe.cells_size());
    ctx.beginPath();
    for (let y = 0; y < cellCntY; ++y) {
        for (let x = 0; x < cellCntX; ++x) {
            ctx.fillStyle = cellAlive(cells, x, y) ? COL_LIVE : COL_DEAD;
            ctx.fillRect(x * (CELL_SIZE + 1) + 1, y * (CELL_SIZE + 1) + 1, CELL_SIZE, CELL_SIZE);
        }
    }
    ctx.stroke();
}
drawGrid();
drawCells();


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Z0I7QUFDaEI7QUFDQTtBQUNBLGtCQUFrQixzRUFBbUI7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjLFFBQVE7QUFDdEIsY0FBYyxRQUFRO0FBQ3RCLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0Esa0JBQWtCLHVFQUFvQjtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0Esa0JBQWtCLHNFQUFtQjtBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0Esa0JBQWtCLHVFQUFvQjtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0Esa0JBQWtCLDBFQUF1QjtBQUN6QztBQUNBO0FBQ0E7QUFDQSxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBLGtCQUFrQiwyRUFBd0I7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjLFFBQVE7QUFDdEIsY0FBYyxRQUFRO0FBQ3RCO0FBQ0E7QUFDQSxRQUFRLHVFQUFvQjtBQUM1QjtBQUNBO0FBQ0E7QUFDQSxjQUFjLFFBQVE7QUFDdEIsY0FBYyxRQUFRO0FBQ3RCO0FBQ0E7QUFDQSxRQUFRLDZFQUEwQjtBQUNsQztBQUNBOztBQUVPOztBQUVBO0FBQ1A7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL3RlY2hub211bmsuZ2l0aHViLmlvLy4vc3JjL2dvbC50cyIsIndlYnBhY2s6Ly90ZWNobm9tdW5rLmdpdGh1Yi5pby8uL3dhc20tZ2FtZS1vZi1saWZlL3BrZy93YXNtX2dhbWVfb2ZfbGlmZV9iZy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uICovXHJcbmltcG9ydCB7IFVuaXZlcnNlIH0gZnJvbSBcIndhc20tZ2FtZS1vZi1saWZlL3dhc21fZ2FtZV9vZl9saWZlXCI7XHJcbmltcG9ydCB7IG1lbW9yeSB9IGZyb20gXCJ3YXNtLWdhbWUtb2YtbGlmZS93YXNtX2dhbWVfb2ZfbGlmZV9iZy53YXNtXCI7XHJcblxyXG5jb25zdCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1haW4tY2FudmFzXCIpIGFzIEhUTUxDYW52YXNFbGVtZW50O1xyXG5jb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSE7XHJcblxyXG5jb25zdCBDRUxMX1NJWkUgPSAxNjsgLy8gcHhcclxuXHJcbmNvbnN0IGNlbGxDbnRYID0gTWF0aC5mbG9vcih3aW5kb3cuaW5uZXJXaWR0aCAvIENFTExfU0laRSksXHJcbmNlbGxDbnRZID0gTWF0aC5mbG9vcih3aW5kb3cuaW5uZXJIZWlnaHQgLyBDRUxMX1NJWkUpO1xyXG5cclxuY29uc3QgQ09MX0xJVkUgPSAnIzAwMDAwMCc7XHJcbmNvbnN0IENPTF9ERUFEID0gJyNGRkZGRkYnO1xyXG5jb25zdCBDT0xfR1JJRCA9ICcjQ0NDQ0NDJztcclxuXHJcbmNhbnZhcy53aWR0aCA9IGNlbGxDbnRYICogQ0VMTF9TSVpFO1xyXG5jYW52YXMuaGVpZ2h0ID0gY2VsbENudFkgKiBDRUxMX1NJWkU7XHJcblxyXG5jb25zdCB1bml2ZXJzZSA9IFVuaXZlcnNlLnJhbmRvbShjZWxsQ250WCwgY2VsbENudFkpO1xyXG5cclxuZnVuY3Rpb24gZHJhd0dyaWQoKSB7XHJcblx0Y3R4LnN0cm9rZVN0eWxlID0gQ09MX0dSSUQ7XHJcblx0XHJcblx0Ly8gVmVydGljYWwgbGluZXMuXHJcblx0Zm9yIChsZXQgeCA9IDA7IHggPD0gY2VsbENudFg7ICsreCkge1xyXG5cdFx0Y3R4Lm1vdmVUbyh4ICogKENFTExfU0laRSArIDEpICsgMSwgMCk7XHJcblx0XHRjdHgubGluZVRvKHggKiAoQ0VMTF9TSVpFICsgMSkgKyAxLCAoQ0VMTF9TSVpFICsgMSkgKiBjZWxsQ250WSArIDEpO1xyXG5cdH1cclxuXHJcblx0Ly8gSG9yaXpvbnRhbCBsaW5lcy5cclxuXHRmb3IgKGxldCB5ID0gMDsgeSA8PSBjZWxsQ250WTsgKyt5KSB7XHJcblx0XHRjdHgubW92ZVRvKDAsIHkgKiAoQ0VMTF9TSVpFICsgMSkgKyAxKTtcclxuXHRcdGN0eC5saW5lVG8oKENFTExfU0laRSArIDEpICogY2VsbENudFggKyAxLCB5ICogKENFTExfU0laRSArIDEpICsgMSk7XHJcblx0fVxyXG5cclxuXHRjdHguc3Ryb2tlKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNlbGxBbGl2ZShjZWxsczogVWludDhBcnJheSwgeDogbnVtYmVyLCB5OiBudW1iZXIpOiBib29sZWFuIHtcclxuXHRjb25zdCBpZHggPSAoeSAqIGNlbGxDbnRYKSArIHg7XHJcblx0Y29uc3QgYnl0ZSA9IE1hdGguZmxvb3IoaWR4IC8gOCk7XHJcblx0Y29uc3QgbWFzayA9IDEgPDwgKGlkeCAlIDgpO1xyXG5cdHJldHVybiAoY2VsbHNbYnl0ZV0gJiBtYXNrKSA9PT0gbWFzaztcclxufVxyXG5cclxuZnVuY3Rpb24gZHJhd0NlbGxzKCkge1xyXG5cdHVuaXZlcnNlLnRpY2soKTtcclxuXHRjb25zdCBjZWxscyA9IG5ldyBVaW50OEFycmF5KG1lbW9yeS5idWZmZXIsIHVuaXZlcnNlLmNlbGxzX3B0cigpLCB1bml2ZXJzZS5jZWxsc19zaXplKCkpO1xyXG4gIFxyXG5cdGN0eC5iZWdpblBhdGgoKTtcclxuICBcclxuXHRmb3IgKGxldCB5ID0gMDsgeSA8IGNlbGxDbnRZOyArK3kpIHtcclxuXHRcdGZvciAobGV0IHggPSAwOyB4IDwgY2VsbENudFg7ICsreCkgeyAgXHJcblx0XHRcdGN0eC5maWxsU3R5bGUgPSBjZWxsQWxpdmUoY2VsbHMsIHgsIHkpID8gQ09MX0xJVkUgOiBDT0xfREVBRDtcclxuICBcclxuXHRcdFx0Y3R4LmZpbGxSZWN0KFxyXG5cdFx0XHRcdHggKiAoQ0VMTF9TSVpFICsgMSkgKyAxLFxyXG5cdFx0XHRcdHkgKiAoQ0VMTF9TSVpFICsgMSkgKyAxLFxyXG5cdFx0XHRcdENFTExfU0laRSxcclxuXHRcdFx0XHRDRUxMX1NJWkVcclxuXHRcdFx0KTtcclxuXHRcdH1cclxuXHR9XHJcbiAgXHJcblx0Y3R4LnN0cm9rZSgpO1xyXG59XHJcblxyXG5kcmF3R3JpZCgpO1xyXG5kcmF3Q2VsbHMoKTtcclxuIiwiaW1wb3J0ICogYXMgd2FzbSBmcm9tICcuL3dhc21fZ2FtZV9vZl9saWZlX2JnLndhc20nO1xuXG5jb25zdCBsVGV4dERlY29kZXIgPSB0eXBlb2YgVGV4dERlY29kZXIgPT09ICd1bmRlZmluZWQnID8gKDAsIG1vZHVsZS5yZXF1aXJlKSgndXRpbCcpLlRleHREZWNvZGVyIDogVGV4dERlY29kZXI7XG5cbmxldCBjYWNoZWRUZXh0RGVjb2RlciA9IG5ldyBsVGV4dERlY29kZXIoJ3V0Zi04JywgeyBpZ25vcmVCT006IHRydWUsIGZhdGFsOiB0cnVlIH0pO1xuXG5jYWNoZWRUZXh0RGVjb2Rlci5kZWNvZGUoKTtcblxubGV0IGNhY2hlZ2V0VWludDhNZW1vcnkwID0gbnVsbDtcbmZ1bmN0aW9uIGdldFVpbnQ4TWVtb3J5MCgpIHtcbiAgICBpZiAoY2FjaGVnZXRVaW50OE1lbW9yeTAgPT09IG51bGwgfHwgY2FjaGVnZXRVaW50OE1lbW9yeTAuYnVmZmVyICE9PSB3YXNtLm1lbW9yeS5idWZmZXIpIHtcbiAgICAgICAgY2FjaGVnZXRVaW50OE1lbW9yeTAgPSBuZXcgVWludDhBcnJheSh3YXNtLm1lbW9yeS5idWZmZXIpO1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGVnZXRVaW50OE1lbW9yeTA7XG59XG5cbmZ1bmN0aW9uIGdldFN0cmluZ0Zyb21XYXNtMChwdHIsIGxlbikge1xuICAgIHJldHVybiBjYWNoZWRUZXh0RGVjb2Rlci5kZWNvZGUoZ2V0VWludDhNZW1vcnkwKCkuc3ViYXJyYXkocHRyLCBwdHIgKyBsZW4pKTtcbn1cblxuZnVuY3Rpb24gbm90RGVmaW5lZCh3aGF0KSB7IHJldHVybiAoKSA9PiB7IHRocm93IG5ldyBFcnJvcihgJHt3aGF0fSBpcyBub3QgZGVmaW5lZGApOyB9OyB9XG4vKipcbiovXG5leHBvcnQgY2xhc3MgVW5pdmVyc2Uge1xuXG4gICAgc3RhdGljIF9fd3JhcChwdHIpIHtcbiAgICAgICAgY29uc3Qgb2JqID0gT2JqZWN0LmNyZWF0ZShVbml2ZXJzZS5wcm90b3R5cGUpO1xuICAgICAgICBvYmoucHRyID0gcHRyO1xuXG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuXG4gICAgX19kZXN0cm95X2ludG9fcmF3KCkge1xuICAgICAgICBjb25zdCBwdHIgPSB0aGlzLnB0cjtcbiAgICAgICAgdGhpcy5wdHIgPSAwO1xuXG4gICAgICAgIHJldHVybiBwdHI7XG4gICAgfVxuXG4gICAgZnJlZSgpIHtcbiAgICAgICAgY29uc3QgcHRyID0gdGhpcy5fX2Rlc3Ryb3lfaW50b19yYXcoKTtcbiAgICAgICAgd2FzbS5fX3diZ191bml2ZXJzZV9mcmVlKHB0cik7XG4gICAgfVxuICAgIC8qKlxuICAgICogR2V0IHRoZSBjZWxsIHN0YXRlIGF0IHByb3ZpZGVkIGNvb3JkaW5hdGVzLlxuICAgICpcbiAgICAqIFRydWUgbWVhbnMgJ2FsaXZlJywgZmFsc2UgbWVhbnMgJ2RlYWQnLlxuICAgICovXG4gICAgdGljaygpIHtcbiAgICAgICAgd2FzbS51bml2ZXJzZV90aWNrKHRoaXMucHRyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgKiBDcmVhdGUgYW4gZW1wdHkgdW5pdmVyc2UuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGhcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcbiAgICAqIEByZXR1cm5zIHtVbml2ZXJzZX1cbiAgICAqL1xuICAgIHN0YXRpYyBlbXB0eSh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHZhciByZXQgPSB3YXNtLnVuaXZlcnNlX2VtcHR5KHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICByZXR1cm4gVW5pdmVyc2UuX193cmFwKHJldCk7XG4gICAgfVxuICAgIC8qKlxuICAgICogSW5pdGlhbGl6ZSBhIG5ldyB1bml2ZXJzZSB3aXRoIGFuIGludGVyZXN0aW5nIHBhdHRlcm4uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGhcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcbiAgICAqIEByZXR1cm5zIHtVbml2ZXJzZX1cbiAgICAqL1xuICAgIHN0YXRpYyByYW5kb20od2lkdGgsIGhlaWdodCkge1xuICAgICAgICB2YXIgcmV0ID0gd2FzbS51bml2ZXJzZV9yYW5kb20od2lkdGgsIGhlaWdodCk7XG4gICAgICAgIHJldHVybiBVbml2ZXJzZS5fX3dyYXAocmV0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgKiBHZXQgdGhlIHdpZHRoIG9mIHRoZSB1bml2ZXJzZSBpbiBjZWxscy5cbiAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgKi9cbiAgICB3aWR0aCgpIHtcbiAgICAgICAgdmFyIHJldCA9IHdhc20udW5pdmVyc2Vfd2lkdGgodGhpcy5wdHIpO1xuICAgICAgICByZXR1cm4gcmV0ID4+PiAwO1xuICAgIH1cbiAgICAvKipcbiAgICAqIEdldCB0aGUgaGVpZ2h0IG9mIHRoZSB1bml2ZXJzZSBpbiBjZWxscy5cbiAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgKi9cbiAgICBoZWlnaHQoKSB7XG4gICAgICAgIHZhciByZXQgPSB3YXNtLnVuaXZlcnNlX2hlaWdodCh0aGlzLnB0cik7XG4gICAgICAgIHJldHVybiByZXQgPj4+IDA7XG4gICAgfVxuICAgIC8qKlxuICAgICogR2V0IHRoZSBwb2ludGVyIHRvIGNlbGwgZGF0YSBpbiB0aGUgdW5pdmVyc2UuXG4gICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICovXG4gICAgY2VsbHNfcHRyKCkge1xuICAgICAgICB2YXIgcmV0ID0gd2FzbS51bml2ZXJzZV9jZWxsc19wdHIodGhpcy5wdHIpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICAvKipcbiAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgKi9cbiAgICBjZWxsc19zaXplKCkge1xuICAgICAgICB2YXIgcmV0ID0gd2FzbS51bml2ZXJzZV9jZWxsc19zaXplKHRoaXMucHRyKTtcbiAgICAgICAgcmV0dXJuIHJldCA+Pj4gMDtcbiAgICB9XG4gICAgLyoqXG4gICAgKiBUb2dnbGUgcHJvdmlkZWQgY2VsbC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB4XG4gICAgKiBAcGFyYW0ge251bWJlcn0geVxuICAgICovXG4gICAgdG9nZ2xlKHgsIHkpIHtcbiAgICAgICAgd2FzbS51bml2ZXJzZV90b2dnbGUodGhpcy5wdHIsIHgsIHkpO1xuICAgIH1cbiAgICAvKipcbiAgICAqIFNwYXduIGEgcmFuZG9tbHkgdHJhbnNmb3JtZWQgZ2xpZGVyIGF0IHByb3ZpZGVkIGNvb3JkaW5hdGVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHhcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB5XG4gICAgKi9cbiAgICBzcGF3bl9nbGlkZXIoeCwgeSkge1xuICAgICAgICB3YXNtLnVuaXZlcnNlX3NwYXduX2dsaWRlcih0aGlzLnB0ciwgeCwgeSk7XG4gICAgfVxufVxuXG5leHBvcnQgY29uc3QgX193YmdfcmFuZG9tXzcyNzczMmRlNDY5NWVjMTUgPSB0eXBlb2YgTWF0aC5yYW5kb20gPT0gJ2Z1bmN0aW9uJyA/IE1hdGgucmFuZG9tIDogbm90RGVmaW5lZCgnTWF0aC5yYW5kb20nKTtcblxuZXhwb3J0IGZ1bmN0aW9uIF9fd2JpbmRnZW5fdGhyb3coYXJnMCwgYXJnMSkge1xuICAgIHRocm93IG5ldyBFcnJvcihnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMCwgYXJnMSkpO1xufTtcblxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9