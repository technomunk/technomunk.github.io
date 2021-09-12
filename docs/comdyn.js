/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/lib/coordinates.ts":
/*!********************************!*\
  !*** ./src/lib/coordinates.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "displayCoordinates": () => (/* binding */ displayCoordinates)
/* harmony export */ });
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/** Set the coordinates to display provided values.
 * @param {number} x The horizontal coordinate to display.
 * @param {number} y The vertical coordinate to display.
 */
function displayCoordinates(x, y) {
    document.getElementById('coord-x').textContent = `Re: ${x.toFixed(15)}`;
    document.getElementById('coord-y').textContent = `Im: ${y.toFixed(15)}`;
}


/***/ }),

/***/ "./src/lib/draw_config.ts":
/*!********************************!*\
  !*** ./src/lib/draw_config.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bindConfig": () => (/* binding */ bindConfig),
/* harmony export */   "resetConfigs": () => (/* binding */ resetConfigs)
/* harmony export */ });
const drawConfigElements = [];
function bindConfig(element, setter) {
    const min = Number(element.min), max = Number(element.max);
    const defaultValue = Number(element.value);
    drawConfigElements.push(element);
    const listener = () => {
        let value = Number(element.value);
        if (element.value === '') {
            value = defaultValue;
            element.value = value.toString();
        }
        if (value < min) {
            value = min;
            element.value = value.toString();
        }
        else if (value > max) {
            value = max;
            element.value = value.toString();
        }
        if (value >= min && value <= max) {
            setter(value);
        }
    };
    element.addEventListener('input', listener);
    element.addEventListener('change', listener);
}
function resetConfigs() {
    drawConfigElements.forEach(element => {
        element.value = '';
        const event = document.createEvent('Event');
        event.initEvent('input');
        element.dispatchEvent(event);
    });
}


/***/ }),

/***/ "./src/lib/gesture.ts":
/*!****************************!*\
  !*** ./src/lib/gesture.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "GestureDecoder": () => (/* binding */ GestureDecoder)
/* harmony export */ });
/** Multi-touch gesture decoder. */
class GestureDecoder {
    cache = [];
    x = 0;
    y = 0;
    delta = 0;
    dragStartHandler;
    dragUpdateHandler;
    dragStopHandler;
    zoomStartHandler;
    zoomUpdateHandler;
    zoomStopHandler;
    /** Construct a gesture decoder based on gestures applied to provided element.
     * @param element The element which events to decode. It is recommended to add
     * `touch-action: none` css to this element.
     */
    constructor(element) {
        element.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        element.addEventListener('pointermove', this.handlePointerMove.bind(this));
        element.addEventListener('pointerup', this.handlePointerUp.bind(this));
        element.addEventListener('pointercancel', this.handlePointerUp.bind(this));
        element.addEventListener('pointerout', this.handlePointerUp.bind(this));
        element.addEventListener('pointerleave', this.handlePointerUp.bind(this));
    }
    /** Set the handler for events of given type.
     * @param type The type of events to use the provided handler for.
     * @param handler The event handler to use.
     */
    on(type, handler) {
        switch (type) {
            case 'dragstart':
                this.dragStartHandler = handler;
                break;
            case 'dragupdate':
                this.dragUpdateHandler = handler;
                break;
            case 'dragstop':
                this.dragStopHandler = handler;
                break;
            case 'zoomstart':
                this.zoomStartHandler = handler;
                break;
            case 'zoomupdate':
                this.zoomUpdateHandler = handler;
                break;
            case 'zoomstop':
                this.zoomStopHandler = handler;
                break;
        }
    }
    handlePointerDown(event) {
        this.cache.push(event);
        // Start or stop relevant gestures.
        switch (this.cache.length) {
            case 1:
                this.startDrag();
                break;
            case 2:
                this.stopDrag();
                this.startZoom();
                break;
            case 3:
                this.stopZoom();
                break;
            default:
            // Do nothing.
        }
    }
    handlePointerMove(event) {
        // Update event
        for (let i = 0; i < this.cache.length; ++i) {
            if (this.cache[i].pointerId == event.pointerId) {
                this.cache[i] = event;
                break;
            }
        }
        switch (this.cache.length) {
            case 1:
                this.updateDrag();
                break;
            case 2:
                this.updateZoom();
                break;
            default:
            // Do nothing.
        }
    }
    handlePointerUp(event) {
        let deferStartDrag = false;
        // Start or stop relevant gestures.
        switch (this.cache.length) {
            case 1:
                this.stopDrag();
                break;
            case 2:
                this.stopZoom();
                deferStartDrag = true;
                break;
            case 3:
                this.startZoom();
                break;
            default:
            // Do nothing.
        }
        // Remove the event from the cache
        for (let i = 0; i < this.cache.length; ++i) {
            if (this.cache[i].pointerId == event.pointerId) {
                this.cache.splice(i, 1);
                break;
            }
        }
        if (deferStartDrag) {
            this.startDrag();
        }
    }
    /** Start the drag gesture.
     *
     * Uses this.cache[0] pointer.
     * Uses this.x and this.y.
     */
    startDrag() {
        this.x = this.cache[0].clientX;
        this.y = this.cache[0].clientY;
        if (this.dragStartHandler != null) {
            this.dragStartHandler({
                x: this.cache[0].clientX - this.x,
                y: this.cache[0].clientY - this.y,
            });
        }
    }
    /** Continue the drag gesture.
     *
     * Uses this.cache[0] pointer.
     * Uses this.x and this.y.
     */
    updateDrag() {
        if (this.dragUpdateHandler != null) {
            this.dragUpdateHandler({
                x: this.cache[0].clientX - this.x,
                y: this.cache[0].clientY - this.y,
            });
        }
    }
    /** Stop the drag gesture.
     *
     * Uses this.cache[0] pointer.
     * Uses this.x and this.y.
     */
    stopDrag() {
        if (this.dragStopHandler != null) {
            this.dragStopHandler({
                x: this.cache[0].clientX - this.x,
                y: this.cache[0].clientY - this.y,
            });
        }
    }
    /** Start the zoom gesture.
     *
     * Uses this.cache[0] and this.cache[1] pointers.
     * Uses this.delta.
     */
    startZoom() {
        const deltaX = this.cache[0].clientX - this.cache[1].clientX;
        const deltaY = this.cache[0].clientY - this.cache[1].clientY;
        this.delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (this.zoomStartHandler != null) {
            const x = (this.cache[0].clientX + this.cache[1].clientX) / 2;
            const y = (this.cache[0].clientY + this.cache[1].clientY) / 2;
            this.zoomStartHandler({ x: x, y: y, scale: 1, });
        }
    }
    /** Continue the zoom gesture.
     *
     * Uses this.cache[0] and this.cache[1] pointers.
     * Uses this.x and this.y.
     */
    updateZoom() {
        if (this.zoomUpdateHandler != null) {
            const x = (this.cache[0].clientX + this.cache[1].clientX) / 2;
            const y = (this.cache[0].clientY + this.cache[1].clientY) / 2;
            const deltaX = this.cache[0].clientX - this.cache[1].clientX;
            const deltaY = this.cache[0].clientY - this.cache[1].clientY;
            const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            this.zoomUpdateHandler({ x: x, y: y, scale: delta / this.delta, });
        }
    }
    /** Stop the zoom gesture.
     *
     * Uses this.cache[0] and this.cache[1] pointers.
     * Uses this.x and this.y.
     */
    stopZoom() {
        if (this.zoomStopHandler != null) {
            const x = (this.cache[0].clientX + this.cache[1].clientX) / 2;
            const y = (this.cache[0].clientY + this.cache[1].clientY) / 2;
            const deltaX = this.cache[0].clientX - this.cache[1].clientX;
            const deltaY = this.cache[0].clientY - this.cache[1].clientY;
            const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            this.zoomStopHandler({ x: x, y: y, scale: delta / this.delta, });
        }
    }
}


/***/ }),

/***/ "./src/lib/glutil.ts":
/*!***************************!*\
  !*** ./src/lib/glutil.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "compileShader": () => (/* binding */ compileShader),
/* harmony export */   "compileProgram": () => (/* binding */ compileProgram),
/* harmony export */   "setupFullviewQuad": () => (/* binding */ setupFullviewQuad)
/* harmony export */ });
/* eslint-disable no-mixed-spaces-and-tabs */
/** Compile a shader from the provided source.
 * @param gl The rendering context to compile the shader with.
 * @param type The type of the shader to compile.
 * @param source The source code of the shader to compile.
 * @returns Successfully compiled shader.
 * @throws Errors if the compilation failed.
 */
function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (shader == null) {
        throw new Error(`Failed to create a shader of type: ${type}`);
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = "Failed to compile shader:\n" + gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(message);
    }
    return shader;
}
/** Compile a shader program using provided vertex and fragment shader sources.
 * @param gl The rendering context to compile the shader program with.
 * @param vertexSource The source code of the vertex shader.
 * @param fragmentSource The source code of the fragment shader.
 * @returns Successfully compiled shader program.
 * @throws Errors if the compiled failed for some reason.
 */
function compileProgram(gl, vertexSource, fragmentSource) {
    const program = gl.createProgram();
    if (program == null) {
        throw new Error("Failed to create a GL program");
    }
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
        gl.deleteProgram(program);
        throw new Error("Failed to create vertex shader!");
    }
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        throw new Error("Failed to create fragment shader!");
    }
    gl.shaderSource(vertexShader, vertexSource);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        let message = "Failed to link shader program:";
        const programInfo = gl.getProgramInfoLog(program);
        if (programInfo) {
            message += '\n' + programInfo;
        }
        const vertexShaderInfo = gl.getShaderInfoLog(vertexShader);
        if (vertexShaderInfo) {
            message += "Vertex shader log:\n" + vertexShaderInfo;
        }
        const fragmentShaderInfo = gl.getShaderInfoLog(fragmentShader);
        if (fragmentShaderInfo) {
            message += "Fragment shader log:\n" + fragmentShaderInfo;
        }
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteProgram(program);
        throw new Error(message);
    }
    // Once the program is linked the shaders are no longer needed, free the resources.
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
}
/** Setup a buffer of 4 vertices that is a quad that takes up full view.
 * @param gl The rendering context that will be used to draw the quad.
 * @param program The shader program used to draw the quad.
 * @param attribute The position or the name of the vertex position attribute.
 * @returns Successfully created and filled buffer.
 * @throws Errors if the buffer was not allocated or the attribute was not found.
 */
function setupFullviewQuad(gl, program, attribute) {
    // Get attribute location
    let attributeLoc;
    if (typeof attribute === typeof 'number') {
        attributeLoc = attribute;
    }
    else {
        attributeLoc = gl.getAttribLocation(program, attribute);
    }
    if (attributeLoc == -1) {
        throw new Error(`Attribute ${attribute} was not found in the provided program.`);
    }
    // Allocate and populate the vertex buffer.
    const buffer = gl.createBuffer();
    if (buffer == null) {
        throw new Error("Failed to create a buffer.");
    }
    const data = new Float32Array([
        -1, -1,
        -1, 1,
        1, -1,
        1, 1,
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.vertexAttribPointer(attributeLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(attributeLoc);
    return buffer;
}


/***/ }),

/***/ "./src/lib/gpu_renderer.ts":
/*!*********************************!*\
  !*** ./src/lib/gpu_renderer.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "init_gpu_renderer": () => (/* binding */ init_gpu_renderer)
/* harmony export */ });
/* harmony import */ var _glutil__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./glutil */ "./src/lib/glutil.ts");
/* eslint-disable @typescript-eslint/no-non-null-assertion */

/** WebGL-based image renderer. */
class GpuRenderer {
    rect = new DOMRect(-1, -1, 2, 2);
    canvas;
    gl;
    program;
    uniforms;
    cachedConfig;
    constructor(canvas, vertex, fragment) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl');
        this.program = (0,_glutil__WEBPACK_IMPORTED_MODULE_0__.compileProgram)(this.gl, vertex, fragment);
        (0,_glutil__WEBPACK_IMPORTED_MODULE_0__.setupFullviewQuad)(this.gl, this.program, 'aPos');
        const widthToHeight = this.canvas.width / this.canvas.height;
        this.rect.width *= widthToHeight;
        this.rect.x *= widthToHeight;
        this.gl.useProgram(this.program);
        this.uniforms = {
            uPos: this.gl.getUniformLocation(this.program, 'uPos'),
            uDims: this.gl.getUniformLocation(this.program, 'uDims'),
            uLim: this.gl.getUniformLocation(this.program, 'uLim'),
            uEscapeD: this.gl.getUniformLocation(this.program, 'uEscapeD'),
            uInsideColor: this.gl.getUniformLocation(this.program, 'uInsideColor'),
        };
    }
    resize(width, height) {
        const widthToHeight = width / height;
        this.rect.height *= height / this.canvas.height;
        this.rect.width = this.rect.height * widthToHeight;
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
        if (this.cachedConfig) {
            this.draw(this.cachedConfig);
        }
    }
    pan(dx, dy) {
        this.rect.x -= dx / this.canvas.width * this.rect.width;
        this.rect.y += dy / this.canvas.height * this.rect.height;
        if (this.cachedConfig) {
            this.draw(this.cachedConfig);
        }
    }
    zoom(x, y, scale) {
        this.rect.x += x / this.canvas.width * (this.rect.width - this.rect.width * scale);
        this.rect.y += (1 - y / this.canvas.height) * (this.rect.height - this.rect.height * scale);
        this.rect.width *= scale;
        this.rect.height *= scale;
        if (this.cachedConfig) {
            this.draw(this.cachedConfig);
        }
    }
    draw(config) {
        this.gl.useProgram(this.program);
        this.gl.uniform2f(this.uniforms['uPos'], this.rect.x + this.rect.width * .5, this.rect.y + this.rect.height * .5);
        this.gl.uniform2f(this.uniforms['uDims'], this.rect.width * .5, this.rect.height * .5);
        this.gl.uniform1i(this.uniforms['uLim'], config.limit);
        this.gl.uniform1f(this.uniforms['uEscapeD'], config.escapeR * 2);
        this.gl.uniform4f(this.uniforms['uInsideColor'], 0, 0, 0, 1);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.cachedConfig = config;
    }
}
function init_gpu_renderer(canvas, type) {
    return Promise.all([
        fetch('shaders/identity.vs', { mode: "same-origin", }).then(response => response.text()),
        fetch(`shaders/${type}.fs`, { mode: "same-origin", }).then(response => response.text()),
    ]).then(([vertex, fragment]) => new GpuRenderer(canvas, vertex, fragment));
}


/***/ }),

/***/ "./src/lib/side_menu.ts":
/*!******************************!*\
  !*** ./src/lib/side_menu.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ SideMenu)
/* harmony export */ });
class SideMenu {
    static DEFAULT_WIDTH = 400;
    menu;
    button;
    width = SideMenu.DEFAULT_WIDTH;
    maxWidth;
    constructor(menu, button, config) {
        this.menu = menu;
        this.button = button;
        if (config != null) {
            this.width = config.width || SideMenu.DEFAULT_WIDTH;
            this.maxWidth = config.max_rel_width;
        }
        this.button.addEventListener('click', this.toggle.bind(this));
        this.close();
    }
    /** Open the side menu. */
    open() {
        if (this.maxWidth != null && window.innerWidth * this.maxWidth < this.width) {
            this.menu.style.width = '100%';
        }
        else {
            this.menu.style.width = `${this.width}px`;
        }
    }
    /** Close the side menu. */
    close() {
        this.menu.style.width = '0px';
    }
    /** Toggle between open and closed states. */
    toggle() {
        if (this.menu.style.width === '0px') {
            this.open();
        }
        else {
            this.close();
        }
    }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!***********************!*\
  !*** ./src/comdyn.ts ***!
  \***********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _lib_coordinates__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./lib/coordinates */ "./src/lib/coordinates.ts");
/* harmony import */ var _lib_draw_config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./lib/draw_config */ "./src/lib/draw_config.ts");
/* harmony import */ var _lib_gesture__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./lib/gesture */ "./src/lib/gesture.ts");
/* harmony import */ var _lib_gpu_renderer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./lib/gpu_renderer */ "./src/lib/gpu_renderer.ts");
/* harmony import */ var _lib_side_menu__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./lib/side_menu */ "./src/lib/side_menu.ts");
/* eslint-disable @typescript-eslint/no-non-null-assertion */





// Constants
const WHEEL_SENSITIVITY = 1e-3;
// Local variables
const canvas = document.getElementById('canvas');
let renderer = null;
let lastX = 0, lastY = 0, lastScale = 0;
let drawConfig;
// Function definitions
function draw() {
    if (renderer && drawConfig) {
        renderer.draw(drawConfig);
    }
}
function handleDrag(drag) {
    if ((lastX != drag.x || lastY != drag.y) && renderer) {
        renderer.pan(drag.x - lastX, drag.y - lastY);
    }
    lastX = drag.x;
    lastY = drag.y;
}
function handleZoom(zoom) {
    handleDrag(zoom);
    if (zoom.scale != lastScale && renderer) {
        renderer.zoom(zoom.x, zoom.y, lastScale / zoom.scale);
    }
    lastScale = zoom.scale;
}
// Script logic
(() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    (0,_lib_gpu_renderer__WEBPACK_IMPORTED_MODULE_3__.init_gpu_renderer)(canvas, 'mandel')
        .then(r => {
        renderer = r;
        requestAnimationFrame(draw);
    });
    const gd = new _lib_gesture__WEBPACK_IMPORTED_MODULE_2__.GestureDecoder(canvas);
    gd.on('dragstart', drag => {
        lastX = drag.x;
        lastY = drag.y;
    });
    gd.on('dragupdate', handleDrag);
    gd.on('dragstop', handleDrag);
    gd.on('zoomstart', zoom => {
        lastX = zoom.x;
        lastY = zoom.y;
        lastScale = zoom.scale;
    });
    gd.on('zoomupdate', handleZoom);
    gd.on('zoomstop', handleZoom);
    canvas.addEventListener('wheel', event => renderer?.zoom(event.clientX, event.clientY, 1 + event.deltaY * WHEEL_SENSITIVITY));
    window.addEventListener('resize', () => renderer?.resize(window.innerWidth, window.innerHeight));
})();
window.onload = () => {
    new _lib_side_menu__WEBPACK_IMPORTED_MODULE_4__["default"](document.getElementById('side-menu'), document.getElementById('toggle-menu'), { width: 400, max_rel_width: .6, });
    // Link configs
    {
        drawConfig = { limit: 0, escapeR: 0, };
        const limit = document.getElementById('limit');
        drawConfig.limit = Number(limit.value);
        (0,_lib_draw_config__WEBPACK_IMPORTED_MODULE_1__.bindConfig)(limit, value => {
            drawConfig.limit = value;
            requestAnimationFrame(draw);
        });
        const escapeR = document.getElementById('escaper');
        drawConfig.escapeR = Number(escapeR.value);
        (0,_lib_draw_config__WEBPACK_IMPORTED_MODULE_1__.bindConfig)(escapeR, value => {
            drawConfig.escapeR = value;
            requestAnimationFrame(draw);
        });
    }
    // Setup fullscreen toggle button
    {
        const button = document.getElementById("toggle_fs");
        if (document.fullscreenEnabled) {
            button.onclick = () => {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
                else {
                    document.documentElement.requestFullscreen();
                }
            };
        }
        else {
            button.remove();
        }
    }
    // Setup redraw and reset buttons
    {
        document.getElementById('redraw').onclick = draw;
        document.getElementById('reset').onclick = () => {
            (0,_lib_draw_config__WEBPACK_IMPORTED_MODULE_1__.resetConfigs)();
            if (renderer) {
                const widthToHeight = canvas.width / canvas.height;
                renderer.rect.y = -1;
                renderer.rect.height = 2;
                renderer.rect.x = -widthToHeight;
                renderer.rect.width = widthToHeight * 2;
                (0,_lib_coordinates__WEBPACK_IMPORTED_MODULE_0__.displayCoordinates)(renderer.rect.x + renderer.rect.width * .5, renderer.rect.y + renderer.rect.height * .5);
            }
        };
    }
    // Setup coordinates
    {
        canvas.addEventListener('mousemove', event => {
            if (renderer) {
                (0,_lib_coordinates__WEBPACK_IMPORTED_MODULE_0__.displayCoordinates)(renderer.rect.x + event.clientX / canvas.width * renderer.rect.width, renderer.rect.y + event.clientY / canvas.height * renderer.rect.height);
            }
        });
        canvas.addEventListener('mouseleave', () => {
            if (renderer) {
                (0,_lib_coordinates__WEBPACK_IMPORTED_MODULE_0__.displayCoordinates)(renderer.rect.x + renderer.rect.width * .5, renderer.rect.y + renderer.rect.height * .5);
            }
        });
        if (renderer) {
            (0,_lib_coordinates__WEBPACK_IMPORTED_MODULE_0__.displayCoordinates)(renderer.rect.x + renderer.rect.width * .5, renderer.rect.y + renderer.rect.height * .5);
        }
    }
};

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RSxFQUMxQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztTQUM5QztLQUNEO0FBQ0YsQ0FBQyxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vdGVjaG5vbXVuay5naXRodWIuaW8vLi9zcmMvbGliL2Nvb3JkaW5hdGVzLnRzIiwid2VicGFjazovL3RlY2hub211bmsuZ2l0aHViLmlvLy4vc3JjL2xpYi9kcmF3X2NvbmZpZy50cyIsIndlYnBhY2s6Ly90ZWNobm9tdW5rLmdpdGh1Yi5pby8uL3NyYy9saWIvZ2VzdHVyZS50cyIsIndlYnBhY2s6Ly90ZWNobm9tdW5rLmdpdGh1Yi5pby8uL3NyYy9saWIvZ2x1dGlsLnRzIiwid2VicGFjazovL3RlY2hub211bmsuZ2l0aHViLmlvLy4vc3JjL2xpYi9ncHVfcmVuZGVyZXIudHMiLCJ3ZWJwYWNrOi8vdGVjaG5vbXVuay5naXRodWIuaW8vLi9zcmMvbGliL3NpZGVfbWVudS50cyIsIndlYnBhY2s6Ly90ZWNobm9tdW5rLmdpdGh1Yi5pby93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly90ZWNobm9tdW5rLmdpdGh1Yi5pby93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vdGVjaG5vbXVuay5naXRodWIuaW8vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly90ZWNobm9tdW5rLmdpdGh1Yi5pby93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3RlY2hub211bmsuZ2l0aHViLmlvLy4vc3JjL2NvbWR5bi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uICovXHJcblxyXG4vKiogU2V0IHRoZSBjb29yZGluYXRlcyB0byBkaXNwbGF5IHByb3ZpZGVkIHZhbHVlcy5cclxuICogQHBhcmFtIHtudW1iZXJ9IHggVGhlIGhvcml6b250YWwgY29vcmRpbmF0ZSB0byBkaXNwbGF5LlxyXG4gKiBAcGFyYW0ge251bWJlcn0geSBUaGUgdmVydGljYWwgY29vcmRpbmF0ZSB0byBkaXNwbGF5LlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGRpc3BsYXlDb29yZGluYXRlcyh4OiBudW1iZXIsIHk6IG51bWJlcik6IHZvaWQge1xyXG5cdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb29yZC14JykhLnRleHRDb250ZW50ID0gYFJlOiAke3gudG9GaXhlZCgxNSl9YDtcclxuXHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29vcmQteScpIS50ZXh0Q29udGVudCA9IGBJbTogJHt5LnRvRml4ZWQoMTUpfWA7XHJcbn1cclxuIiwiY29uc3QgZHJhd0NvbmZpZ0VsZW1lbnRzOiBBcnJheTxIVE1MSW5wdXRFbGVtZW50PiA9IFtdO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGJpbmRDb25maWcoZWxlbWVudDogSFRNTElucHV0RWxlbWVudCwgc2V0dGVyOiAodmFsOiBudW1iZXIpID0+IHZvaWQpOiB2b2lkIHtcclxuXHRjb25zdCBtaW4gPSBOdW1iZXIoZWxlbWVudC5taW4pLFxyXG5cdFx0bWF4ID0gTnVtYmVyKGVsZW1lbnQubWF4KTtcclxuXHRjb25zdCBkZWZhdWx0VmFsdWUgPSBOdW1iZXIoZWxlbWVudC52YWx1ZSk7XHJcblx0ZHJhd0NvbmZpZ0VsZW1lbnRzLnB1c2goZWxlbWVudCk7XHJcblx0XHJcblx0Y29uc3QgbGlzdGVuZXIgPSAoKSA9PiB7XHJcblx0XHRsZXQgdmFsdWUgPSBOdW1iZXIoZWxlbWVudC52YWx1ZSk7XHJcblx0XHRpZiAoZWxlbWVudC52YWx1ZSA9PT0gJycpIHtcclxuXHRcdFx0dmFsdWUgPSBkZWZhdWx0VmFsdWU7XHJcblx0XHRcdGVsZW1lbnQudmFsdWUgPSB2YWx1ZS50b1N0cmluZygpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh2YWx1ZSA8IG1pbikge1xyXG5cdFx0XHR2YWx1ZSA9IG1pbjtcclxuXHRcdFx0ZWxlbWVudC52YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7XHJcblx0XHR9IGVsc2UgaWYgKHZhbHVlID4gbWF4KSB7XHJcblx0XHRcdHZhbHVlID0gbWF4O1xyXG5cdFx0XHRlbGVtZW50LnZhbHVlID0gdmFsdWUudG9TdHJpbmcoKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAodmFsdWUgPj0gbWluICYmIHZhbHVlIDw9IG1heCkge1xyXG5cdFx0XHRzZXR0ZXIodmFsdWUpO1xyXG5cdFx0fVxyXG5cdH07XHJcblx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGxpc3RlbmVyKTtcclxuXHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGxpc3RlbmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0Q29uZmlncygpOiB2b2lkIHtcclxuXHRkcmF3Q29uZmlnRWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuXHRcdGVsZW1lbnQudmFsdWUgPSAnJztcclxuXHRcdGNvbnN0IGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XHJcblx0XHRldmVudC5pbml0RXZlbnQoJ2lucHV0Jyk7XHJcblx0XHRlbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xyXG5cdH0pO1xyXG59XHJcbiIsIlxyXG4vKiogQW4gZXZlbnQgdGhhdCBpcyBpbnZva2VkIGJ5IGRyYWdnaW5nIGdlc3R1cmVzLCBleDogbW91c2UtZHJhZy4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBEcmFnRXZlbnQge1xyXG5cdC8qKiBBY2N1bXVsYXRlZCBob3Jpem9udGFsIGRpc3RhbmNlIHNpbmNlIHRoZSBzdGFydCBvZiB0aGUgZHJhZy4gKi9cclxuXHRyZWFkb25seSB4OiBudW1iZXI7XHJcblx0LyoqIEFjY3VtdWxhdGVkIHZlcnRpY2FsIGRpc3RhbmNlIHNpbmNlIHRoZSBzdGFydCBvZiB0aGUgZHJhZy4gKi9cclxuXHRyZWFkb25seSB5OiBudW1iZXI7XHJcbn1cclxuXHJcbi8qKiBBbiBldmVudCB0aGF0IGlzIGludm9rZWQgYnkgem9vbWluZyBnZXN0dXJlcywgZXg6IHBpbmNoaW5nLiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFpvb21FdmVudCB7XHJcblx0LyoqIEhvcml6b250YWwgY2VudGVyIG9mIHRoZSB6b29tLiAqL1xyXG5cdHJlYWRvbmx5IHg6IG51bWJlcjtcclxuXHQvKiogVmVydGljYWwgY2VudGVyIG9mIHRoZSB6b29tLiAqL1xyXG5cdHJlYWRvbmx5IHk6IG51bWJlcjtcclxuXHQvKiogVG90YWwgYWNjdW11bGF0ZWQgc2NhbGUgb2YgdGhlIHpvb20uICovXHJcblx0cmVhZG9ubHkgc2NhbGU6IG51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIEV2ZW50TWFwIHtcclxuXHQnZHJhZ3N0YXJ0JzogRHJhZ0V2ZW50LFxyXG5cdCdkcmFndXBkYXRlJzogRHJhZ0V2ZW50LFxyXG5cdCdkcmFnc3RvcCc6IERyYWdFdmVudCxcclxuXHJcblx0J3pvb21zdGFydCc6IFpvb21FdmVudCxcclxuXHQnem9vbXVwZGF0ZSc6IFpvb21FdmVudCxcclxuXHQnem9vbXN0b3AnOiBab29tRXZlbnQsXHJcbn1cclxuXHJcbnR5cGUgRHJhZ0V2ZW50SGFuZGxlciA9IChldmVudDogRHJhZ0V2ZW50KSA9PiB2b2lkO1xyXG50eXBlIFpvb21FdmVudEhhbmRsZXIgPSAoZXZlbnQ6IFpvb21FdmVudCkgPT4gdm9pZDtcclxuXHJcbi8qKiBNdWx0aS10b3VjaCBnZXN0dXJlIGRlY29kZXIuICovXHJcbmV4cG9ydCBjbGFzcyBHZXN0dXJlRGVjb2RlciB7XHJcblx0cHJpdmF0ZSBjYWNoZTogUG9pbnRlckV2ZW50W10gPSBbXTtcclxuXHRwcml2YXRlIHggPSAwO1xyXG5cdHByaXZhdGUgeSA9IDA7XHJcblx0cHJpdmF0ZSBkZWx0YSA9IDA7XHJcblxyXG5cdHByaXZhdGUgZHJhZ1N0YXJ0SGFuZGxlcj86IERyYWdFdmVudEhhbmRsZXI7XHJcblx0cHJpdmF0ZSBkcmFnVXBkYXRlSGFuZGxlcj86IERyYWdFdmVudEhhbmRsZXI7XHJcblx0cHJpdmF0ZSBkcmFnU3RvcEhhbmRsZXI/OiBEcmFnRXZlbnRIYW5kbGVyO1xyXG5cclxuXHRwcml2YXRlIHpvb21TdGFydEhhbmRsZXI/OiBab29tRXZlbnRIYW5kbGVyO1xyXG5cdHByaXZhdGUgem9vbVVwZGF0ZUhhbmRsZXI/OiBab29tRXZlbnRIYW5kbGVyO1xyXG5cdHByaXZhdGUgem9vbVN0b3BIYW5kbGVyPzogWm9vbUV2ZW50SGFuZGxlcjtcclxuXHRcclxuXHQvKiogQ29uc3RydWN0IGEgZ2VzdHVyZSBkZWNvZGVyIGJhc2VkIG9uIGdlc3R1cmVzIGFwcGxpZWQgdG8gcHJvdmlkZWQgZWxlbWVudC5cclxuXHQgKiBAcGFyYW0gZWxlbWVudCBUaGUgZWxlbWVudCB3aGljaCBldmVudHMgdG8gZGVjb2RlLiBJdCBpcyByZWNvbW1lbmRlZCB0byBhZGRcclxuXHQgKiBgdG91Y2gtYWN0aW9uOiBub25lYCBjc3MgdG8gdGhpcyBlbGVtZW50LlxyXG5cdCAqL1xyXG5cdHB1YmxpYyBjb25zdHJ1Y3RvcihlbGVtZW50OiBIVE1MRWxlbWVudCkge1xyXG5cdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIHRoaXMuaGFuZGxlUG9pbnRlckRvd24uYmluZCh0aGlzKSk7XHJcblx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgdGhpcy5oYW5kbGVQb2ludGVyTW92ZS5iaW5kKHRoaXMpKTtcclxuXHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgdGhpcy5oYW5kbGVQb2ludGVyVXAuYmluZCh0aGlzKSk7XHJcblx0XHRlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJjYW5jZWwnLCB0aGlzLmhhbmRsZVBvaW50ZXJVcC5iaW5kKHRoaXMpKTtcclxuXHRcdGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm91dCcsIHRoaXMuaGFuZGxlUG9pbnRlclVwLmJpbmQodGhpcykpO1xyXG5cdFx0ZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybGVhdmUnLCB0aGlzLmhhbmRsZVBvaW50ZXJVcC5iaW5kKHRoaXMpKTtcclxuXHR9XHJcblxyXG5cdC8qKiBTZXQgdGhlIGhhbmRsZXIgZm9yIGV2ZW50cyBvZiBnaXZlbiB0eXBlLlxyXG5cdCAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIGV2ZW50cyB0byB1c2UgdGhlIHByb3ZpZGVkIGhhbmRsZXIgZm9yLlxyXG5cdCAqIEBwYXJhbSBoYW5kbGVyIFRoZSBldmVudCBoYW5kbGVyIHRvIHVzZS5cclxuXHQgKi9cclxuXHRwdWJsaWMgb248SyBleHRlbmRzIGtleW9mIEV2ZW50TWFwPih0eXBlOiBLLCBoYW5kbGVyOiAoZXZlbnQ6IEV2ZW50TWFwW0tdKSA9PiB2b2lkKTogdm9pZCB7XHJcblx0XHRzd2l0Y2ggKHR5cGUpIHtcclxuXHRcdGNhc2UgJ2RyYWdzdGFydCc6XHJcblx0XHRcdHRoaXMuZHJhZ1N0YXJ0SGFuZGxlciA9IGhhbmRsZXIgYXMgRHJhZ0V2ZW50SGFuZGxlcjtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlICdkcmFndXBkYXRlJzpcclxuXHRcdFx0dGhpcy5kcmFnVXBkYXRlSGFuZGxlciA9IGhhbmRsZXIgYXMgRHJhZ0V2ZW50SGFuZGxlcjtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlICdkcmFnc3RvcCc6XHJcblx0XHRcdHRoaXMuZHJhZ1N0b3BIYW5kbGVyID0gaGFuZGxlciBhcyBEcmFnRXZlbnRIYW5kbGVyO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdGNhc2UgJ3pvb21zdGFydCc6XHJcblx0XHRcdHRoaXMuem9vbVN0YXJ0SGFuZGxlciA9IGhhbmRsZXIgYXMgWm9vbUV2ZW50SGFuZGxlcjtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlICd6b29tdXBkYXRlJzpcclxuXHRcdFx0dGhpcy56b29tVXBkYXRlSGFuZGxlciA9IGhhbmRsZXIgYXMgWm9vbUV2ZW50SGFuZGxlcjtcclxuXHRcdFx0YnJlYWs7XHJcblx0XHRjYXNlICd6b29tc3RvcCc6XHJcblx0XHRcdHRoaXMuem9vbVN0b3BIYW5kbGVyID0gaGFuZGxlciBhcyBab29tRXZlbnRIYW5kbGVyO1xyXG5cdFx0XHRicmVhaztcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHByaXZhdGUgaGFuZGxlUG9pbnRlckRvd24oZXZlbnQ6IFBvaW50ZXJFdmVudCkge1xyXG5cdFx0dGhpcy5jYWNoZS5wdXNoKGV2ZW50KTtcclxuXHJcblx0XHQvLyBTdGFydCBvciBzdG9wIHJlbGV2YW50IGdlc3R1cmVzLlxyXG5cdFx0c3dpdGNoICh0aGlzLmNhY2hlLmxlbmd0aCkge1xyXG5cdFx0XHRjYXNlIDE6XHJcblx0XHRcdFx0dGhpcy5zdGFydERyYWcoKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAyOlxyXG5cdFx0XHRcdHRoaXMuc3RvcERyYWcoKTtcclxuXHRcdFx0XHR0aGlzLnN0YXJ0Wm9vbSgpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlIDM6XHJcblx0XHRcdFx0dGhpcy5zdG9wWm9vbSgpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdC8vIERvIG5vdGhpbmcuXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIGhhbmRsZVBvaW50ZXJNb3ZlKGV2ZW50OiBQb2ludGVyRXZlbnQpIHtcclxuXHRcdC8vIFVwZGF0ZSBldmVudFxyXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhY2hlLmxlbmd0aDsgKytpKSB7XHJcblx0XHRcdGlmICh0aGlzLmNhY2hlW2ldLnBvaW50ZXJJZCA9PSBldmVudC5wb2ludGVySWQpIHtcclxuXHRcdFx0XHR0aGlzLmNhY2hlW2ldID0gZXZlbnQ7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRzd2l0Y2ggKHRoaXMuY2FjaGUubGVuZ3RoKSB7XHJcblx0XHRcdGNhc2UgMTpcclxuXHRcdFx0XHR0aGlzLnVwZGF0ZURyYWcoKTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAyOlxyXG5cdFx0XHRcdHRoaXMudXBkYXRlWm9vbSgpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRkZWZhdWx0OlxyXG5cdFx0XHRcdC8vIERvIG5vdGhpbmcuXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIGhhbmRsZVBvaW50ZXJVcChldmVudDogUG9pbnRlckV2ZW50KSB7XHJcblx0XHRsZXQgZGVmZXJTdGFydERyYWcgPSBmYWxzZTtcclxuXHJcblx0XHQvLyBTdGFydCBvciBzdG9wIHJlbGV2YW50IGdlc3R1cmVzLlxyXG5cdFx0c3dpdGNoICh0aGlzLmNhY2hlLmxlbmd0aCkge1xyXG5cdFx0XHRjYXNlIDE6XHJcblx0XHRcdFx0dGhpcy5zdG9wRHJhZygpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRjYXNlIDI6XHJcblx0XHRcdFx0dGhpcy5zdG9wWm9vbSgpO1xyXG5cdFx0XHRcdGRlZmVyU3RhcnREcmFnID0gdHJ1ZTtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAzOlxyXG5cdFx0XHRcdHRoaXMuc3RhcnRab29tKCk7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGRlZmF1bHQ6XHJcblx0XHRcdFx0Ly8gRG8gbm90aGluZy5cclxuXHRcdH1cclxuXHJcblx0XHQvLyBSZW1vdmUgdGhlIGV2ZW50IGZyb20gdGhlIGNhY2hlXHJcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FjaGUubGVuZ3RoOyArK2kpIHtcclxuXHRcdFx0aWYgKHRoaXMuY2FjaGVbaV0ucG9pbnRlcklkID09IGV2ZW50LnBvaW50ZXJJZCkge1xyXG5cdFx0XHRcdHRoaXMuY2FjaGUuc3BsaWNlKGksIDEpO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGRlZmVyU3RhcnREcmFnKSB7XHJcblx0XHRcdHRoaXMuc3RhcnREcmFnKCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvKiogU3RhcnQgdGhlIGRyYWcgZ2VzdHVyZS5cclxuXHQgKlxyXG5cdCAqIFVzZXMgdGhpcy5jYWNoZVswXSBwb2ludGVyLlxyXG5cdCAqIFVzZXMgdGhpcy54IGFuZCB0aGlzLnkuXHJcblx0ICovXHJcblx0cHJpdmF0ZSBzdGFydERyYWcoKSB7XHJcblx0XHR0aGlzLnggPSB0aGlzLmNhY2hlWzBdLmNsaWVudFg7XHJcblx0XHR0aGlzLnkgPSB0aGlzLmNhY2hlWzBdLmNsaWVudFk7XHJcblx0XHRpZiAodGhpcy5kcmFnU3RhcnRIYW5kbGVyICE9IG51bGwpIHtcclxuXHRcdFx0dGhpcy5kcmFnU3RhcnRIYW5kbGVyKHtcclxuXHRcdFx0XHR4OiB0aGlzLmNhY2hlWzBdLmNsaWVudFggLSB0aGlzLngsXHJcblx0XHRcdFx0eTogdGhpcy5jYWNoZVswXS5jbGllbnRZIC0gdGhpcy55LFxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9XHJcblx0LyoqIENvbnRpbnVlIHRoZSBkcmFnIGdlc3R1cmUuXHJcblx0ICpcclxuXHQgKiBVc2VzIHRoaXMuY2FjaGVbMF0gcG9pbnRlci5cclxuXHQgKiBVc2VzIHRoaXMueCBhbmQgdGhpcy55LlxyXG5cdCAqL1xyXG5cdHByaXZhdGUgdXBkYXRlRHJhZygpIHtcclxuXHRcdGlmICh0aGlzLmRyYWdVcGRhdGVIYW5kbGVyICE9IG51bGwpIHtcclxuXHRcdFx0dGhpcy5kcmFnVXBkYXRlSGFuZGxlcih7XHJcblx0XHRcdFx0eDogdGhpcy5jYWNoZVswXS5jbGllbnRYIC0gdGhpcy54LFxyXG5cdFx0XHRcdHk6IHRoaXMuY2FjaGVbMF0uY2xpZW50WSAtIHRoaXMueSxcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKiBTdG9wIHRoZSBkcmFnIGdlc3R1cmUuXHJcblx0ICpcclxuXHQgKiBVc2VzIHRoaXMuY2FjaGVbMF0gcG9pbnRlci5cclxuXHQgKiBVc2VzIHRoaXMueCBhbmQgdGhpcy55LlxyXG5cdCAqL1xyXG5cdHByaXZhdGUgc3RvcERyYWcoKSB7XHJcblx0XHRpZiAodGhpcy5kcmFnU3RvcEhhbmRsZXIgIT0gbnVsbCkge1xyXG5cdFx0XHR0aGlzLmRyYWdTdG9wSGFuZGxlcih7XHJcblx0XHRcdFx0eDogdGhpcy5jYWNoZVswXS5jbGllbnRYIC0gdGhpcy54LFxyXG5cdFx0XHRcdHk6IHRoaXMuY2FjaGVbMF0uY2xpZW50WSAtIHRoaXMueSxcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvKiogU3RhcnQgdGhlIHpvb20gZ2VzdHVyZS5cclxuXHQgKlxyXG5cdCAqIFVzZXMgdGhpcy5jYWNoZVswXSBhbmQgdGhpcy5jYWNoZVsxXSBwb2ludGVycy5cclxuXHQgKiBVc2VzIHRoaXMuZGVsdGEuXHJcblx0ICovXHJcblx0cHJpdmF0ZSBzdGFydFpvb20oKSB7XHJcblx0XHRjb25zdCBkZWx0YVggPSB0aGlzLmNhY2hlWzBdLmNsaWVudFggLSB0aGlzLmNhY2hlWzFdLmNsaWVudFg7XHJcblx0XHRjb25zdCBkZWx0YVkgPSB0aGlzLmNhY2hlWzBdLmNsaWVudFkgLSB0aGlzLmNhY2hlWzFdLmNsaWVudFk7XHJcblx0XHR0aGlzLmRlbHRhID0gTWF0aC5zcXJ0KGRlbHRhWCpkZWx0YVggKyBkZWx0YVkqZGVsdGFZKTtcclxuXHJcblx0XHRpZiAodGhpcy56b29tU3RhcnRIYW5kbGVyICE9IG51bGwpIHtcclxuXHRcdFx0Y29uc3QgeCA9ICh0aGlzLmNhY2hlWzBdLmNsaWVudFggKyB0aGlzLmNhY2hlWzFdLmNsaWVudFgpIC8gMjtcclxuXHRcdFx0Y29uc3QgeSA9ICh0aGlzLmNhY2hlWzBdLmNsaWVudFkgKyB0aGlzLmNhY2hlWzFdLmNsaWVudFkpIC8gMjtcclxuXHJcblx0XHRcdHRoaXMuem9vbVN0YXJ0SGFuZGxlcih7IHg6IHgsIHk6IHksIHNjYWxlOiAxLCB9KTtcclxuXHRcdH1cclxuXHR9XHJcblx0LyoqIENvbnRpbnVlIHRoZSB6b29tIGdlc3R1cmUuXHJcblx0ICpcclxuXHQgKiBVc2VzIHRoaXMuY2FjaGVbMF0gYW5kIHRoaXMuY2FjaGVbMV0gcG9pbnRlcnMuXHJcblx0ICogVXNlcyB0aGlzLnggYW5kIHRoaXMueS5cclxuXHQgKi9cclxuXHRwcml2YXRlIHVwZGF0ZVpvb20oKSB7XHJcblx0XHRpZiAodGhpcy56b29tVXBkYXRlSGFuZGxlciAhPSBudWxsKSB7XHJcblx0XHRcdGNvbnN0IHggPSAodGhpcy5jYWNoZVswXS5jbGllbnRYICsgdGhpcy5jYWNoZVsxXS5jbGllbnRYKSAvIDI7XHJcblx0XHRcdGNvbnN0IHkgPSAodGhpcy5jYWNoZVswXS5jbGllbnRZICsgdGhpcy5jYWNoZVsxXS5jbGllbnRZKSAvIDI7XHJcblx0XHRcdGNvbnN0IGRlbHRhWCA9IHRoaXMuY2FjaGVbMF0uY2xpZW50WCAtIHRoaXMuY2FjaGVbMV0uY2xpZW50WDtcclxuXHRcdFx0Y29uc3QgZGVsdGFZID0gdGhpcy5jYWNoZVswXS5jbGllbnRZIC0gdGhpcy5jYWNoZVsxXS5jbGllbnRZO1xyXG5cdFx0XHRjb25zdCBkZWx0YSA9IE1hdGguc3FydChkZWx0YVgqZGVsdGFYICsgZGVsdGFZKmRlbHRhWSk7XHJcblxyXG5cdFx0XHR0aGlzLnpvb21VcGRhdGVIYW5kbGVyKHsgeDogeCwgeTogeSwgc2NhbGU6IGRlbHRhIC8gdGhpcy5kZWx0YSwgfSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKiBTdG9wIHRoZSB6b29tIGdlc3R1cmUuXHJcblx0ICpcclxuXHQgKiBVc2VzIHRoaXMuY2FjaGVbMF0gYW5kIHRoaXMuY2FjaGVbMV0gcG9pbnRlcnMuXHJcblx0ICogVXNlcyB0aGlzLnggYW5kIHRoaXMueS5cclxuXHQgKi9cclxuXHRwcml2YXRlIHN0b3Bab29tKCkge1xyXG5cdFx0aWYgKHRoaXMuem9vbVN0b3BIYW5kbGVyICE9IG51bGwpIHtcclxuXHRcdFx0Y29uc3QgeCA9ICh0aGlzLmNhY2hlWzBdLmNsaWVudFggKyB0aGlzLmNhY2hlWzFdLmNsaWVudFgpIC8gMjtcclxuXHRcdFx0Y29uc3QgeSA9ICh0aGlzLmNhY2hlWzBdLmNsaWVudFkgKyB0aGlzLmNhY2hlWzFdLmNsaWVudFkpIC8gMjtcclxuXHRcdFx0Y29uc3QgZGVsdGFYID0gdGhpcy5jYWNoZVswXS5jbGllbnRYIC0gdGhpcy5jYWNoZVsxXS5jbGllbnRYO1xyXG5cdFx0XHRjb25zdCBkZWx0YVkgPSB0aGlzLmNhY2hlWzBdLmNsaWVudFkgLSB0aGlzLmNhY2hlWzFdLmNsaWVudFk7XHJcblx0XHRcdGNvbnN0IGRlbHRhID0gTWF0aC5zcXJ0KGRlbHRhWCpkZWx0YVggKyBkZWx0YVkqZGVsdGFZKTtcclxuXHJcblx0XHRcdHRoaXMuem9vbVN0b3BIYW5kbGVyKHsgeDogeCwgeTogeSwgc2NhbGU6IGRlbHRhIC8gdGhpcy5kZWx0YSwgfSk7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcbiIsIi8qIGVzbGludC1kaXNhYmxlIG5vLW1peGVkLXNwYWNlcy1hbmQtdGFicyAqL1xyXG5cclxuLyoqIENvbXBpbGUgYSBzaGFkZXIgZnJvbSB0aGUgcHJvdmlkZWQgc291cmNlLlxyXG4gKiBAcGFyYW0gZ2wgVGhlIHJlbmRlcmluZyBjb250ZXh0IHRvIGNvbXBpbGUgdGhlIHNoYWRlciB3aXRoLlxyXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiB0aGUgc2hhZGVyIHRvIGNvbXBpbGUuXHJcbiAqIEBwYXJhbSBzb3VyY2UgVGhlIHNvdXJjZSBjb2RlIG9mIHRoZSBzaGFkZXIgdG8gY29tcGlsZS5cclxuICogQHJldHVybnMgU3VjY2Vzc2Z1bGx5IGNvbXBpbGVkIHNoYWRlci5cclxuICogQHRocm93cyBFcnJvcnMgaWYgdGhlIGNvbXBpbGF0aW9uIGZhaWxlZC5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjb21waWxlU2hhZGVyKFxyXG5cdGdsOiBXZWJHTFJlbmRlcmluZ0NvbnRleHQsXHJcblx0dHlwZTogR0xlbnVtLFxyXG5cdHNvdXJjZTogc3RyaW5nXHJcbik6IFdlYkdMU2hhZGVyIHtcclxuXHRjb25zdCBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIodHlwZSk7XHJcblx0aWYgKHNoYWRlciA9PSBudWxsKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBjcmVhdGUgYSBzaGFkZXIgb2YgdHlwZTogJHt0eXBlfWApO1xyXG5cdH1cclxuXHJcblx0Z2wuc2hhZGVyU291cmNlKHNoYWRlciwgc291cmNlKTtcclxuXHRnbC5jb21waWxlU2hhZGVyKHNoYWRlcik7XHJcblxyXG5cdGlmICggISBnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUykpIHtcclxuXHRcdGNvbnN0IG1lc3NhZ2UgPSBcIkZhaWxlZCB0byBjb21waWxlIHNoYWRlcjpcXG5cIiArIGdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKTtcclxuXHRcdGdsLmRlbGV0ZVNoYWRlcihzaGFkZXIpO1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHNoYWRlcjtcclxufVxyXG5cclxuLyoqIENvbXBpbGUgYSBzaGFkZXIgcHJvZ3JhbSB1c2luZyBwcm92aWRlZCB2ZXJ0ZXggYW5kIGZyYWdtZW50IHNoYWRlciBzb3VyY2VzLlxyXG4gKiBAcGFyYW0gZ2wgVGhlIHJlbmRlcmluZyBjb250ZXh0IHRvIGNvbXBpbGUgdGhlIHNoYWRlciBwcm9ncmFtIHdpdGguXHJcbiAqIEBwYXJhbSB2ZXJ0ZXhTb3VyY2UgVGhlIHNvdXJjZSBjb2RlIG9mIHRoZSB2ZXJ0ZXggc2hhZGVyLlxyXG4gKiBAcGFyYW0gZnJhZ21lbnRTb3VyY2UgVGhlIHNvdXJjZSBjb2RlIG9mIHRoZSBmcmFnbWVudCBzaGFkZXIuXHJcbiAqIEByZXR1cm5zIFN1Y2Nlc3NmdWxseSBjb21waWxlZCBzaGFkZXIgcHJvZ3JhbS5cclxuICogQHRocm93cyBFcnJvcnMgaWYgdGhlIGNvbXBpbGVkIGZhaWxlZCBmb3Igc29tZSByZWFzb24uXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY29tcGlsZVByb2dyYW0oXHJcblx0Z2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCxcclxuXHR2ZXJ0ZXhTb3VyY2U6IHN0cmluZyxcclxuXHRmcmFnbWVudFNvdXJjZTogc3RyaW5nXHJcbik6IFdlYkdMUHJvZ3JhbSB7XHJcblx0Y29uc3QgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcclxuXHRpZiAocHJvZ3JhbSA9PSBudWxsKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gY3JlYXRlIGEgR0wgcHJvZ3JhbVwiKTtcclxuXHR9XHJcblxyXG5cdGNvbnN0IHZlcnRleFNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5WRVJURVhfU0hBREVSKTtcclxuXHRpZiAoICEgdmVydGV4U2hhZGVyKSB7XHJcblx0XHRnbC5kZWxldGVQcm9ncmFtKHByb2dyYW0pO1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGNyZWF0ZSB2ZXJ0ZXggc2hhZGVyIVwiKTtcclxuXHR9XHJcblxyXG5cdGNvbnN0IGZyYWdtZW50U2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKGdsLkZSQUdNRU5UX1NIQURFUik7XHJcblx0aWYgKCAhIGZyYWdtZW50U2hhZGVyKSB7XHJcblx0XHRnbC5kZWxldGVQcm9ncmFtKHByb2dyYW0pO1xyXG5cdFx0Z2wuZGVsZXRlU2hhZGVyKHZlcnRleFNoYWRlcik7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gY3JlYXRlIGZyYWdtZW50IHNoYWRlciFcIik7XHJcblx0fVxyXG5cclxuXHRnbC5zaGFkZXJTb3VyY2UodmVydGV4U2hhZGVyLCB2ZXJ0ZXhTb3VyY2UpO1xyXG5cdGdsLnNoYWRlclNvdXJjZShmcmFnbWVudFNoYWRlciwgZnJhZ21lbnRTb3VyY2UpO1xyXG5cdGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2ZXJ0ZXhTaGFkZXIpO1xyXG5cdGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcmFnbWVudFNoYWRlcik7XHJcblxyXG5cdGdsLmNvbXBpbGVTaGFkZXIodmVydGV4U2hhZGVyKTtcclxuXHRnbC5jb21waWxlU2hhZGVyKGZyYWdtZW50U2hhZGVyKTtcclxuXHJcblx0Z2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XHJcblx0XHJcblx0aWYgKCAhIGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpKSB7XHJcblx0XHRsZXQgbWVzc2FnZSA9IFwiRmFpbGVkIHRvIGxpbmsgc2hhZGVyIHByb2dyYW06XCI7XHJcblx0XHRjb25zdCBwcm9ncmFtSW5mbyA9IGdsLmdldFByb2dyYW1JbmZvTG9nKHByb2dyYW0pO1xyXG5cdFx0aWYgKHByb2dyYW1JbmZvKSB7XHJcblx0XHRcdG1lc3NhZ2UgKz0gJ1xcbicgKyBwcm9ncmFtSW5mbztcclxuXHRcdH1cclxuXHRcdGNvbnN0IHZlcnRleFNoYWRlckluZm8gPSBnbC5nZXRTaGFkZXJJbmZvTG9nKHZlcnRleFNoYWRlcik7XHJcblx0XHRpZiAodmVydGV4U2hhZGVySW5mbykge1xyXG5cdFx0XHRtZXNzYWdlICs9IFwiVmVydGV4IHNoYWRlciBsb2c6XFxuXCIgKyB2ZXJ0ZXhTaGFkZXJJbmZvO1xyXG5cdFx0fVxyXG5cdFx0Y29uc3QgZnJhZ21lbnRTaGFkZXJJbmZvID0gZ2wuZ2V0U2hhZGVySW5mb0xvZyhmcmFnbWVudFNoYWRlcik7XHJcblx0XHRpZiAoZnJhZ21lbnRTaGFkZXJJbmZvKSB7XHJcblx0XHRcdG1lc3NhZ2UgKz0gXCJGcmFnbWVudCBzaGFkZXIgbG9nOlxcblwiICsgZnJhZ21lbnRTaGFkZXJJbmZvO1xyXG5cdFx0fVxyXG5cclxuXHRcdGdsLmRlbGV0ZVNoYWRlcih2ZXJ0ZXhTaGFkZXIpO1xyXG5cdFx0Z2wuZGVsZXRlU2hhZGVyKGZyYWdtZW50U2hhZGVyKTtcclxuXHRcdGdsLmRlbGV0ZVByb2dyYW0ocHJvZ3JhbSk7XHJcblx0XHRcclxuXHRcdHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcclxuXHR9XHJcblxyXG5cdC8vIE9uY2UgdGhlIHByb2dyYW0gaXMgbGlua2VkIHRoZSBzaGFkZXJzIGFyZSBubyBsb25nZXIgbmVlZGVkLCBmcmVlIHRoZSByZXNvdXJjZXMuXHJcblx0Z2wuZGVsZXRlU2hhZGVyKHZlcnRleFNoYWRlcik7XHJcblx0Z2wuZGVsZXRlU2hhZGVyKGZyYWdtZW50U2hhZGVyKTtcclxuXHJcblx0cmV0dXJuIHByb2dyYW07XHJcbn1cclxuXHJcbi8qKiBTZXR1cCBhIGJ1ZmZlciBvZiA0IHZlcnRpY2VzIHRoYXQgaXMgYSBxdWFkIHRoYXQgdGFrZXMgdXAgZnVsbCB2aWV3LlxyXG4gKiBAcGFyYW0gZ2wgVGhlIHJlbmRlcmluZyBjb250ZXh0IHRoYXQgd2lsbCBiZSB1c2VkIHRvIGRyYXcgdGhlIHF1YWQuXHJcbiAqIEBwYXJhbSBwcm9ncmFtIFRoZSBzaGFkZXIgcHJvZ3JhbSB1c2VkIHRvIGRyYXcgdGhlIHF1YWQuXHJcbiAqIEBwYXJhbSBhdHRyaWJ1dGUgVGhlIHBvc2l0aW9uIG9yIHRoZSBuYW1lIG9mIHRoZSB2ZXJ0ZXggcG9zaXRpb24gYXR0cmlidXRlLlxyXG4gKiBAcmV0dXJucyBTdWNjZXNzZnVsbHkgY3JlYXRlZCBhbmQgZmlsbGVkIGJ1ZmZlci5cclxuICogQHRocm93cyBFcnJvcnMgaWYgdGhlIGJ1ZmZlciB3YXMgbm90IGFsbG9jYXRlZCBvciB0aGUgYXR0cmlidXRlIHdhcyBub3QgZm91bmQuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc2V0dXBGdWxsdmlld1F1YWQoXHJcblx0Z2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dCxcclxuXHRwcm9ncmFtOiBXZWJHTFByb2dyYW0sXHJcblx0YXR0cmlidXRlOiBHTGludCB8IHN0cmluZ1xyXG4pOiBXZWJHTEJ1ZmZlciB7XHJcblx0Ly8gR2V0IGF0dHJpYnV0ZSBsb2NhdGlvblxyXG5cdGxldCBhdHRyaWJ1dGVMb2M6IEdMaW50O1xyXG5cdGlmICh0eXBlb2YgYXR0cmlidXRlID09PSB0eXBlb2YgJ251bWJlcicpIHtcclxuXHRcdGF0dHJpYnV0ZUxvYyA9IGF0dHJpYnV0ZSBhcyBHTGludDtcclxuXHR9IGVsc2Uge1xyXG5cdFx0YXR0cmlidXRlTG9jID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgYXR0cmlidXRlIGFzIHN0cmluZyk7XHJcblx0fVxyXG5cclxuXHRpZiAoYXR0cmlidXRlTG9jID09IC0xKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoYEF0dHJpYnV0ZSAke2F0dHJpYnV0ZX0gd2FzIG5vdCBmb3VuZCBpbiB0aGUgcHJvdmlkZWQgcHJvZ3JhbS5gKTtcclxuXHR9XHJcblxyXG5cdC8vIEFsbG9jYXRlIGFuZCBwb3B1bGF0ZSB0aGUgdmVydGV4IGJ1ZmZlci5cclxuXHRjb25zdCBidWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuXHRpZiAoYnVmZmVyID09IG51bGwpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBjcmVhdGUgYSBidWZmZXIuXCIpO1xyXG5cdH1cclxuXHRjb25zdCBkYXRhID0gbmV3IEZsb2F0MzJBcnJheShbXHJcblx0XHQtMSwgLTEsXHJcblx0XHQtMSwgIDEsXHJcblx0XHQgMSwgLTEsXHJcblx0XHQgMSwgIDEsXHJcblx0XSk7XHJcblxyXG5cdGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIpO1xyXG5cdGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBkYXRhLCBnbC5TVEFUSUNfRFJBVyk7XHJcblx0Z2wudmVydGV4QXR0cmliUG9pbnRlcihhdHRyaWJ1dGVMb2MsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XHJcblx0Z2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoYXR0cmlidXRlTG9jKTtcclxuXHJcblx0cmV0dXJuIGJ1ZmZlcjtcclxufVxyXG4iLCIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tbm9uLW51bGwtYXNzZXJ0aW9uICovXHJcbmltcG9ydCB7IGNvbXBpbGVQcm9ncmFtLCBzZXR1cEZ1bGx2aWV3UXVhZCB9IGZyb20gXCIuL2dsdXRpbFwiO1xyXG5pbXBvcnQgeyBJbWFnZVR5cGUsIE1hbmRlbENvbmZpZywgUmVuZGVyZXIgfSBmcm9tIFwiLi9pcmVuZGVyZXJcIjtcclxuXHJcbnR5cGUgTWFuZGVsVW5pZm9ybXMgPSB7XHJcblx0dVBvczogV2ViR0xVbmlmb3JtTG9jYXRpb24sXHJcblx0dURpbXM6IFdlYkdMVW5pZm9ybUxvY2F0aW9uLFxyXG5cdHVMaW06IFdlYkdMVW5pZm9ybUxvY2F0aW9uLFxyXG5cdHVFc2NhcGVEOiBXZWJHTFVuaWZvcm1Mb2NhdGlvbixcclxuXHR1SW5zaWRlQ29sb3I6IFdlYkdMVW5pZm9ybUxvY2F0aW9uLFxyXG59O1xyXG5cclxuLyoqIFdlYkdMLWJhc2VkIGltYWdlIHJlbmRlcmVyLiAqL1xyXG5jbGFzcyBHcHVSZW5kZXJlciBpbXBsZW1lbnRzIFJlbmRlcmVyIHtcclxuXHRyZWN0OiBET01SZWN0ID0gbmV3IERPTVJlY3QoLTEsIC0xLCAyLCAyKTtcclxuXHJcblx0cHJpdmF0ZSBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xyXG5cdHByaXZhdGUgZ2w6IFdlYkdMUmVuZGVyaW5nQ29udGV4dDtcclxuXHRwcml2YXRlIHByb2dyYW06IFdlYkdMUHJvZ3JhbTtcclxuXHJcblx0cHJpdmF0ZSB1bmlmb3JtczogTWFuZGVsVW5pZm9ybXM7XHJcblx0cHJpdmF0ZSBjYWNoZWRDb25maWc6IE1hbmRlbENvbmZpZyB8IHVuZGVmaW5lZDtcclxuXHJcblx0Y29uc3RydWN0b3IoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCwgdmVydGV4OiBzdHJpbmcsIGZyYWdtZW50OiBzdHJpbmcpIHtcclxuXHRcdHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG5cdFx0dGhpcy5nbCA9IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcpITtcclxuXHJcblx0XHR0aGlzLnByb2dyYW0gPSBjb21waWxlUHJvZ3JhbSh0aGlzLmdsLCB2ZXJ0ZXgsIGZyYWdtZW50KTtcclxuXHRcdHNldHVwRnVsbHZpZXdRdWFkKHRoaXMuZ2wsIHRoaXMucHJvZ3JhbSwgJ2FQb3MnKTtcclxuXHJcblx0XHRjb25zdCB3aWR0aFRvSGVpZ2h0ID0gdGhpcy5jYW52YXMud2lkdGggLyB0aGlzLmNhbnZhcy5oZWlnaHQ7XHJcblx0XHR0aGlzLnJlY3Qud2lkdGggKj0gd2lkdGhUb0hlaWdodDtcclxuXHRcdHRoaXMucmVjdC54ICo9IHdpZHRoVG9IZWlnaHQ7XHJcblxyXG5cdFx0dGhpcy5nbC51c2VQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XHJcblx0XHR0aGlzLnVuaWZvcm1zID0ge1xyXG5cdFx0XHR1UG9zOiB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnByb2dyYW0sICd1UG9zJykhLFxyXG5cdFx0XHR1RGltczogdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5wcm9ncmFtLCAndURpbXMnKSEsXHJcblx0XHRcdHVMaW06IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMucHJvZ3JhbSwgJ3VMaW0nKSEsXHJcblx0XHRcdHVFc2NhcGVEOiB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnByb2dyYW0sICd1RXNjYXBlRCcpISxcclxuXHRcdFx0dUluc2lkZUNvbG9yOiB0aGlzLmdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnByb2dyYW0sICd1SW5zaWRlQ29sb3InKSEsXHJcblx0XHR9O1xyXG5cdH1cclxuXHJcblx0cmVzaXplKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKTogdm9pZCB7XHJcblx0XHRjb25zdCB3aWR0aFRvSGVpZ2h0ID0gd2lkdGggLyBoZWlnaHQ7XHJcblxyXG5cdFx0dGhpcy5yZWN0LmhlaWdodCAqPSBoZWlnaHQgLyB0aGlzLmNhbnZhcy5oZWlnaHQ7XHJcblx0XHR0aGlzLnJlY3Qud2lkdGggPSB0aGlzLnJlY3QuaGVpZ2h0ICogd2lkdGhUb0hlaWdodDtcclxuXHJcblx0XHR0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG5cdFx0dGhpcy5jYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG5cclxuXHRcdHRoaXMuZ2wudmlld3BvcnQoMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcblxyXG5cdFx0aWYgKHRoaXMuY2FjaGVkQ29uZmlnKSB7XHJcblx0XHRcdHRoaXMuZHJhdyh0aGlzLmNhY2hlZENvbmZpZyk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRwYW4oZHg6IG51bWJlciwgZHk6IG51bWJlcik6IHZvaWQge1xyXG5cdFx0dGhpcy5yZWN0LnggLT0gZHggLyB0aGlzLmNhbnZhcy53aWR0aCAqIHRoaXMucmVjdC53aWR0aDtcclxuXHRcdHRoaXMucmVjdC55ICs9IGR5IC8gdGhpcy5jYW52YXMuaGVpZ2h0ICogdGhpcy5yZWN0LmhlaWdodDtcclxuXHJcblx0XHRpZiAodGhpcy5jYWNoZWRDb25maWcpIHtcclxuXHRcdFx0dGhpcy5kcmF3KHRoaXMuY2FjaGVkQ29uZmlnKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHpvb20oeDogbnVtYmVyLCB5OiBudW1iZXIsIHNjYWxlOiBudW1iZXIpOiB2b2lkIHtcclxuXHRcdHRoaXMucmVjdC54ICs9IHggLyB0aGlzLmNhbnZhcy53aWR0aCAqICh0aGlzLnJlY3Qud2lkdGggLSB0aGlzLnJlY3Qud2lkdGggKiBzY2FsZSk7XHJcblx0XHR0aGlzLnJlY3QueSArPSAoMSAtIHkgLyB0aGlzLmNhbnZhcy5oZWlnaHQpICogKHRoaXMucmVjdC5oZWlnaHQgLSB0aGlzLnJlY3QuaGVpZ2h0ICogc2NhbGUpO1xyXG5cdFx0dGhpcy5yZWN0LndpZHRoICo9IHNjYWxlO1xyXG5cdFx0dGhpcy5yZWN0LmhlaWdodCAqPSBzY2FsZTtcclxuXHJcblx0XHRpZiAodGhpcy5jYWNoZWRDb25maWcpIHtcclxuXHRcdFx0dGhpcy5kcmF3KHRoaXMuY2FjaGVkQ29uZmlnKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGRyYXcoY29uZmlnOiBNYW5kZWxDb25maWcpOiB2b2lkIHtcclxuXHRcdHRoaXMuZ2wudXNlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xyXG5cdFx0dGhpcy5nbC51bmlmb3JtMmYodGhpcy51bmlmb3Jtc1sndVBvcyddLCB0aGlzLnJlY3QueCArIHRoaXMucmVjdC53aWR0aCAqIC41LCB0aGlzLnJlY3QueSArIHRoaXMucmVjdC5oZWlnaHQgKiAuNSk7XHJcblx0XHR0aGlzLmdsLnVuaWZvcm0yZih0aGlzLnVuaWZvcm1zWyd1RGltcyddLCB0aGlzLnJlY3Qud2lkdGggKiAuNSwgdGhpcy5yZWN0LmhlaWdodCAqIC41KTtcclxuXHRcdHRoaXMuZ2wudW5pZm9ybTFpKHRoaXMudW5pZm9ybXNbJ3VMaW0nXSwgY29uZmlnLmxpbWl0KTtcclxuXHRcdHRoaXMuZ2wudW5pZm9ybTFmKHRoaXMudW5pZm9ybXNbJ3VFc2NhcGVEJ10sIGNvbmZpZy5lc2NhcGVSICogMilcclxuXHRcdHRoaXMuZ2wudW5pZm9ybTRmKHRoaXMudW5pZm9ybXNbJ3VJbnNpZGVDb2xvciddLCAwLCAwLCAwLCAxKTtcclxuXHJcblx0XHR0aGlzLmdsLmRyYXdBcnJheXModGhpcy5nbC5UUklBTkdMRV9TVFJJUCwgMCwgNCk7XHJcblx0XHR0aGlzLmNhY2hlZENvbmZpZyA9IGNvbmZpZztcclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpbml0X2dwdV9yZW5kZXJlcihcclxuXHRjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LFxyXG5cdHR5cGU6IEltYWdlVHlwZSlcclxuXHQ6IFByb21pc2U8R3B1UmVuZGVyZXI+XHJcbntcclxuXHRyZXR1cm4gUHJvbWlzZS5hbGwoW1xyXG5cdFx0ZmV0Y2goJ3NoYWRlcnMvaWRlbnRpdHkudnMnLCB7IG1vZGU6IFwic2FtZS1vcmlnaW5cIiwgfSkudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS50ZXh0KCkpLFxyXG5cdFx0ZmV0Y2goYHNoYWRlcnMvJHt0eXBlfS5mc2AsIHsgbW9kZTogXCJzYW1lLW9yaWdpblwiLCB9KS50aGVuKHJlc3BvbnNlID0+IHJlc3BvbnNlLnRleHQoKSksXHJcblx0XSkudGhlbigoW3ZlcnRleCwgZnJhZ21lbnRdKSA9PiBuZXcgR3B1UmVuZGVyZXIoY2FudmFzLCB2ZXJ0ZXgsIGZyYWdtZW50KSk7XHJcbn1cclxuIiwiLyoqIE9wdGlvbmFsIGNvbmZpZ3VyYXRpb24gZm9yIGluaXRpYWxpemF0aW9uIG9mIGEgU2lkZU1lbnUuICovXHJcbmludGVyZmFjZSBTaWRlTWVudUNvbmZpZyB7XHJcblx0Ly8gVGhlIHdpZHRoIG9mIHRoZSBvcGVuZWQgbWVudSBpbiBwb2ludHMuXHJcblx0d2lkdGg/OiBudW1iZXIsXHJcblx0Ly8gTWF4aW11bSByZWxhdGl2ZSB3aWR0aCBvZiB0aGUgd2hvbGUgdmlld3BvcnQgdGhlIG1lbnUgbWF5IG9jY3VweS5cclxuXHRtYXhfcmVsX3dpZHRoPzogbnVtYmVyLFxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTaWRlTWVudSB7XHJcblx0cHVibGljIHN0YXRpYyBERUZBVUxUX1dJRFRIID0gNDAwO1xyXG5cclxuXHRwdWJsaWMgbWVudTogSFRNTEVsZW1lbnQ7XHJcblx0cHVibGljIGJ1dHRvbjogSFRNTEVsZW1lbnQ7XHJcblxyXG5cdHByaXZhdGUgd2lkdGg6IG51bWJlciA9IFNpZGVNZW51LkRFRkFVTFRfV0lEVEg7XHJcblx0cHJpdmF0ZSBtYXhXaWR0aD86IG51bWJlcjtcclxuXHJcblx0cHVibGljIGNvbnN0cnVjdG9yKFxyXG5cdFx0bWVudTogSFRNTEVsZW1lbnQsXHJcblx0XHRidXR0b246IEhUTUxFbGVtZW50LFxyXG5cdFx0Y29uZmlnPzogU2lkZU1lbnVDb25maWdcclxuXHQpIHtcclxuXHRcdHRoaXMubWVudSA9IG1lbnU7XHJcblx0XHR0aGlzLmJ1dHRvbiA9IGJ1dHRvbjtcclxuXHRcdGlmIChjb25maWcgIT0gbnVsbCkge1xyXG5cdFx0XHR0aGlzLndpZHRoID0gY29uZmlnLndpZHRoIHx8IFNpZGVNZW51LkRFRkFVTFRfV0lEVEg7XHJcblx0XHRcdHRoaXMubWF4V2lkdGggPSBjb25maWcubWF4X3JlbF93aWR0aDtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlLmJpbmQodGhpcykpO1xyXG5cdFx0dGhpcy5jbG9zZSgpO1xyXG5cdH1cclxuXHJcblx0LyoqIE9wZW4gdGhlIHNpZGUgbWVudS4gKi9cclxuXHRwdWJsaWMgb3BlbigpOiB2b2lkIHtcclxuXHRcdGlmICh0aGlzLm1heFdpZHRoICE9IG51bGwgJiYgd2luZG93LmlubmVyV2lkdGggKiB0aGlzLm1heFdpZHRoIDwgdGhpcy53aWR0aCkge1xyXG5cdFx0XHR0aGlzLm1lbnUuc3R5bGUud2lkdGggPSAnMTAwJSc7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLm1lbnUuc3R5bGUud2lkdGggPSBgJHt0aGlzLndpZHRofXB4YDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8qKiBDbG9zZSB0aGUgc2lkZSBtZW51LiAqL1xyXG5cdHB1YmxpYyBjbG9zZSgpOiB2b2lkIHtcclxuXHRcdHRoaXMubWVudS5zdHlsZS53aWR0aCA9ICcwcHgnO1xyXG5cdH1cclxuXHJcblx0LyoqIFRvZ2dsZSBiZXR3ZWVuIG9wZW4gYW5kIGNsb3NlZCBzdGF0ZXMuICovXHJcblx0cHVibGljIHRvZ2dsZSgpOiB2b2lkIHtcclxuXHRcdGlmICh0aGlzLm1lbnUuc3R5bGUud2lkdGggPT09ICcwcHgnKSB7XHJcblx0XHRcdHRoaXMub3BlbigpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5jbG9zZSgpO1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1ub24tbnVsbC1hc3NlcnRpb24gKi9cclxuaW1wb3J0IHsgZGlzcGxheUNvb3JkaW5hdGVzIH0gZnJvbSBcIi4vbGliL2Nvb3JkaW5hdGVzXCI7XHJcbmltcG9ydCB7IGJpbmRDb25maWcsIHJlc2V0Q29uZmlncyB9IGZyb20gXCIuL2xpYi9kcmF3X2NvbmZpZ1wiO1xyXG5pbXBvcnQgeyBHZXN0dXJlRGVjb2RlciwgRHJhZ0V2ZW50IGFzIERyYWdHZXN0LCBab29tRXZlbnQgYXMgWm9vbUdlc3QgfSBmcm9tIFwiLi9saWIvZ2VzdHVyZVwiO1xyXG5pbXBvcnQgeyBpbml0X2dwdV9yZW5kZXJlciB9IGZyb20gXCIuL2xpYi9ncHVfcmVuZGVyZXJcIjtcclxuaW1wb3J0IHsgTWFuZGVsQ29uZmlnLCBSZW5kZXJlciB9IGZyb20gXCIuL2xpYi9pcmVuZGVyZXJcIjtcclxuaW1wb3J0IFNpZGVNZW51IGZyb20gXCIuL2xpYi9zaWRlX21lbnVcIjtcclxuXHJcbi8vIENvbnN0YW50c1xyXG5cclxuY29uc3QgV0hFRUxfU0VOU0lUSVZJVFkgPSAxZS0zO1xyXG5cclxuXHJcbi8vIExvY2FsIHZhcmlhYmxlc1xyXG5cclxuY29uc3QgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpIGFzIEhUTUxDYW52YXNFbGVtZW50O1xyXG5sZXQgcmVuZGVyZXI6IFJlbmRlcmVyIHwgbnVsbCA9IG51bGw7XHJcbmxldCBsYXN0WCA9IDAsIGxhc3RZID0gMCwgbGFzdFNjYWxlID0gMDtcclxubGV0IGRyYXdDb25maWc6IE1hbmRlbENvbmZpZyB8IHVuZGVmaW5lZDtcclxuXHJcblxyXG4vLyBGdW5jdGlvbiBkZWZpbml0aW9uc1xyXG5cclxuZnVuY3Rpb24gZHJhdygpIHtcclxuXHRpZiAocmVuZGVyZXIgJiYgZHJhd0NvbmZpZykge1xyXG5cdFx0cmVuZGVyZXIuZHJhdyhkcmF3Q29uZmlnKTtcclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhbmRsZURyYWcoZHJhZzogRHJhZ0dlc3QpIHtcclxuXHRpZiAoKGxhc3RYICE9IGRyYWcueCB8fCBsYXN0WSAhPSBkcmFnLnkpICYmIHJlbmRlcmVyKSB7XHJcblx0XHRyZW5kZXJlci5wYW4oZHJhZy54IC0gbGFzdFgsIGRyYWcueSAtIGxhc3RZKTtcclxuXHR9XHJcblx0bGFzdFggPSBkcmFnLng7XHJcblx0bGFzdFkgPSBkcmFnLnk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhbmRsZVpvb20oem9vbTogWm9vbUdlc3QpIHtcclxuXHRoYW5kbGVEcmFnKHpvb20pO1xyXG5cdGlmICh6b29tLnNjYWxlICE9IGxhc3RTY2FsZSAmJiByZW5kZXJlcikge1xyXG5cdFx0cmVuZGVyZXIuem9vbSh6b29tLngsIHpvb20ueSwgbGFzdFNjYWxlIC8gem9vbS5zY2FsZSk7XHJcblx0fVxyXG5cdGxhc3RTY2FsZSA9IHpvb20uc2NhbGU7XHJcbn1cclxuXHJcblxyXG4vLyBTY3JpcHQgbG9naWNcclxuXHJcbigoKSA9PiB7XHJcblx0Y2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XHJcblx0Y2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuXHJcblx0aW5pdF9ncHVfcmVuZGVyZXIoY2FudmFzLCAnbWFuZGVsJylcclxuXHRcdC50aGVuKHIgPT4ge1xyXG5cdFx0XHRyZW5kZXJlciA9IHI7XHJcblx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3KTtcclxuXHRcdH0pO1xyXG5cclxuXHRjb25zdCBnZCA9IG5ldyBHZXN0dXJlRGVjb2RlcihjYW52YXMpO1xyXG5cdGdkLm9uKCdkcmFnc3RhcnQnLCBkcmFnID0+IHtcclxuXHRcdGxhc3RYID0gZHJhZy54O1xyXG5cdFx0bGFzdFkgPSBkcmFnLnk7XHJcblx0fSk7XHJcblx0Z2Qub24oJ2RyYWd1cGRhdGUnLCBoYW5kbGVEcmFnKTtcclxuXHRnZC5vbignZHJhZ3N0b3AnLCBoYW5kbGVEcmFnKTtcclxuXHJcblx0Z2Qub24oJ3pvb21zdGFydCcsIHpvb20gPT4ge1xyXG5cdFx0bGFzdFggPSB6b29tLng7XHJcblx0XHRsYXN0WSA9IHpvb20ueTtcclxuXHRcdGxhc3RTY2FsZSA9IHpvb20uc2NhbGU7XHJcblx0fSlcclxuXHRnZC5vbignem9vbXVwZGF0ZScsIGhhbmRsZVpvb20pO1xyXG5cdGdkLm9uKCd6b29tc3RvcCcsIGhhbmRsZVpvb20pO1xyXG5cclxuXHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignd2hlZWwnLCBldmVudCA9PiByZW5kZXJlcj8uem9vbShldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZLCAxICsgZXZlbnQuZGVsdGFZICogV0hFRUxfU0VOU0lUSVZJVFkpKTtcclxuXHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4gcmVuZGVyZXI/LnJlc2l6ZSh3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0KSk7XHJcbn0pKCk7XHJcblxyXG53aW5kb3cub25sb2FkID0gKCkgPT4ge1xyXG5cdG5ldyBTaWRlTWVudShcclxuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaWRlLW1lbnUnKSEsXHJcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9nZ2xlLW1lbnUnKSEsXHJcblx0XHR7IHdpZHRoOiA0MDAsIG1heF9yZWxfd2lkdGg6IC42LCB9KTtcclxuXHJcblx0Ly8gTGluayBjb25maWdzXHJcblx0e1xyXG5cdFx0ZHJhd0NvbmZpZyA9IHsgbGltaXQ6IDAsIGVzY2FwZVI6IDAsIH07XHJcblxyXG5cdFx0Y29uc3QgbGltaXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGltaXQnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xyXG5cdFx0ZHJhd0NvbmZpZy5saW1pdCA9IE51bWJlcihsaW1pdC52YWx1ZSk7XHJcblx0XHRiaW5kQ29uZmlnKGxpbWl0LCB2YWx1ZSA9PiB7XHJcblx0XHRcdGRyYXdDb25maWchLmxpbWl0ID0gdmFsdWU7XHJcblx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3KTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdGNvbnN0IGVzY2FwZVIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXNjYXBlcicpIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XHJcblx0XHRkcmF3Q29uZmlnLmVzY2FwZVIgPSBOdW1iZXIoZXNjYXBlUi52YWx1ZSk7XHJcblx0XHRiaW5kQ29uZmlnKGVzY2FwZVIsIHZhbHVlID0+IHtcclxuXHRcdFx0ZHJhd0NvbmZpZyEuZXNjYXBlUiA9IHZhbHVlO1xyXG5cdFx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhdyk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdC8vIFNldHVwIGZ1bGxzY3JlZW4gdG9nZ2xlIGJ1dHRvblxyXG5cdHtcclxuXHRcdGNvbnN0IGJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidG9nZ2xlX2ZzXCIpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xyXG5cdFx0aWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbmFibGVkKSB7XHJcblx0XHRcdGJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xyXG5cdFx0XHRcdGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCkge1xyXG5cdFx0XHRcdFx0ZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4oKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0YnV0dG9uLnJlbW92ZSgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly8gU2V0dXAgcmVkcmF3IGFuZCByZXNldCBidXR0b25zXHJcblx0e1xyXG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlZHJhdycpIS5vbmNsaWNrID0gZHJhdztcclxuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXNldCcpIS5vbmNsaWNrID0gKCkgPT4ge1xyXG5cdFx0XHRyZXNldENvbmZpZ3MoKTtcclxuXHRcdFx0aWYgKHJlbmRlcmVyKSB7XHJcblx0XHRcdFx0Y29uc3Qgd2lkdGhUb0hlaWdodCA9IGNhbnZhcy53aWR0aCAvIGNhbnZhcy5oZWlnaHQ7XHJcblx0XHRcdFx0cmVuZGVyZXIucmVjdC55ID0gLTE7XHJcblx0XHRcdFx0cmVuZGVyZXIucmVjdC5oZWlnaHQgPSAyO1xyXG5cdFx0XHRcdHJlbmRlcmVyLnJlY3QueCA9IC13aWR0aFRvSGVpZ2h0O1xyXG5cdFx0XHRcdHJlbmRlcmVyLnJlY3Qud2lkdGggPSB3aWR0aFRvSGVpZ2h0ICogMjtcclxuXHJcblx0XHRcdFx0ZGlzcGxheUNvb3JkaW5hdGVzKFxyXG5cdFx0XHRcdFx0cmVuZGVyZXIucmVjdC54ICsgcmVuZGVyZXIucmVjdC53aWR0aCAqIC41LFxyXG5cdFx0XHRcdFx0cmVuZGVyZXIucmVjdC55ICsgcmVuZGVyZXIucmVjdC5oZWlnaHQgKiAuNSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIFNldHVwIGNvb3JkaW5hdGVzXHJcblx0e1xyXG5cdFx0Y2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGV2ZW50ID0+IHtcclxuXHRcdFx0aWYgKHJlbmRlcmVyKSB7XHJcblx0XHRcdFx0ZGlzcGxheUNvb3JkaW5hdGVzKFxyXG5cdFx0XHRcdFx0cmVuZGVyZXIucmVjdC54ICsgZXZlbnQuY2xpZW50WCAvIGNhbnZhcy53aWR0aCAqIHJlbmRlcmVyLnJlY3Qud2lkdGgsXHJcblx0XHRcdFx0XHRyZW5kZXJlci5yZWN0LnkgKyBldmVudC5jbGllbnRZIC8gY2FudmFzLmhlaWdodCAqIHJlbmRlcmVyLnJlY3QuaGVpZ2h0KTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0XHRjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsICgpID0+IHtcclxuXHRcdFx0aWYgKHJlbmRlcmVyKSB7XHJcblx0XHRcdFx0ZGlzcGxheUNvb3JkaW5hdGVzKFxyXG5cdFx0XHRcdFx0cmVuZGVyZXIucmVjdC54ICsgcmVuZGVyZXIucmVjdC53aWR0aCAqIC41LFxyXG5cdFx0XHRcdFx0cmVuZGVyZXIucmVjdC55ICsgcmVuZGVyZXIucmVjdC5oZWlnaHQgKiAuNSk7XHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cclxuXHRcdGlmIChyZW5kZXJlcikge1xyXG5cdFx0XHRkaXNwbGF5Q29vcmRpbmF0ZXMoXHJcblx0XHRcdFx0cmVuZGVyZXIucmVjdC54ICsgcmVuZGVyZXIucmVjdC53aWR0aCAqIC41LFxyXG5cdFx0XHRcdHJlbmRlcmVyLnJlY3QueSArIHJlbmRlcmVyLnJlY3QuaGVpZ2h0ICogLjUpO1xyXG5cdFx0fVxyXG5cdH1cclxufTtcclxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9