(()=>{"use strict";var t={447:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0});const i=new Uint8ClampedArray;function s(t,e,i,s){let h=t+e,a=i+s;return t>=i&&t<=a&&h>=i&&h<=a}e.default=class{constructor(t,e,i,s=64,h=64){this.updateInProgress=!1,this.updateQueued=!1,this.prefill=!1,this.offsetX=0,this.offsetY=0,this.cleanX=0,this.cleanY=0,this.cleanW=0,this.cleanH=0,this.config={limit:30,escapeRadius:4},this.canvas=t,this.context=t.getContext("2d",{alpha:!1}),this.chunkWidth=s,this.chunkHeight=h,this.viewport=e||this.defaultViewport,i=i||window.navigator.hardwareConcurrency,this.freeWorkers=[],this.work=[];for(var a=0;a<i;++a){let t=new Worker("./dw.js"),e=new Uint8ClampedArray(s*h*4);((t,e)=>{t.onmessage=i=>{let s=new Uint8ClampedArray(i.data.pixels);i.data.zoomW===this.viewport.width&&i.data.zoomH===this.viewport.height&&e.context.putImageData(new ImageData(s,i.data.width,i.data.height),i.data.pixelX+e.offsetX-i.data.offsetX,i.data.pixelY+e.offsetY-i.data.offsetY);let h=e.work.pop();null!=h?(h.pixels=s.buffer,t.postMessage(h,[h.pixels])):(e.freeWorkers.push([t,s]),e.updateInProgress=!1,e.updateQueued?e.update():(e.cleanX=0,e.cleanY=0,e.cleanW=e.canvas.width,e.cleanH=e.canvas.height))}})(t,this),this.freeWorkers.push([t,e])}}get defaultViewport(){if(this.canvas.width>=this.canvas.height){let t=this.canvas.width/this.canvas.height;return new DOMRect(-t,-1,2*t,2)}{let t=this.canvas.height/this.canvas.width;return new DOMRect(-1,-t,2,2*t)}}get limit(){return this.config.limit}set limit(t){this.config.limit=t}get escapeRadius(){return this.config.escapeRadius}set escapeRadius(t){this.config.escapeRadius=t}get fillStyle(){return this.prefill?this.context.fillStyle:null}set fillStyle(t){null!=t?(this.prefill=!0,this.context.fillStyle=t):this.prefill=!1}update(){this.cleanW=0,this.cleanH=0,this.offsetX=0,this.offsetY=0,this.updateDirty()}updateDirty(){this.clearWork(),this.updateQueued=!1,this.updateInProgress=!0;let t=Math.ceil(this.canvas.width/this.chunkWidth),e=Math.ceil(this.canvas.height/this.chunkHeight);const h=this.chunkWidth/this.canvas.width*this.viewport.width,a=this.chunkHeight/this.canvas.height*this.viewport.height;for(var n=0;n<e;++n){const e=n*this.chunkHeight,o=this.viewport.y+n*this.chunkHeight/this.canvas.height*this.viewport.height,l=s(e,this.chunkHeight,this.cleanY,this.cleanH);for(var c=0;c<t;++c){const t=c*this.chunkWidth;if(l&&s(t,this.chunkWidth,this.cleanX,this.cleanW))continue;const n=this.viewport.x+c*this.chunkWidth/this.canvas.width*this.viewport.width;this.prefill&&this.context.fillRect(t,e,this.chunkWidth,this.chunkHeight),this.queueWork({pixels:i,width:this.chunkWidth,height:this.chunkHeight,rect:new DOMRect(n,o,h,a),config:this.config,pixelX:t,pixelY:e,offsetX:this.offsetX,offsetY:this.offsetY,zoomW:this.viewport.width,zoomH:this.viewport.height})}}this.work.reverse()}queueUpdate(){this.updateInProgress?this.updateQueued=!0:this.update()}pan(t,e){let i=t>=0?t:this.canvas.width+t,s=e>=0?e:this.canvas.height+e,h=[];if(this.viewport.x-=t/this.canvas.width*this.viewport.width,this.viewport.y-=e/this.canvas.height*this.viewport.height,h=[new DOMRect(0,0,i,s),new DOMRect(i,0,this.canvas.width-i,s),new DOMRect(0,s,i,this.canvas.height-s),new DOMRect(i,s,this.canvas.width-i,this.canvas.height-s)],t<0&&e<0){let i=this.context.getImageData(-t,-e,h[0].width,h[0].height);this.context.putImageData(i,0,0)}else if(t>=0&&e<0){let i=this.context.getImageData(0,-e,h[1].width,h[1].height);this.context.putImageData(i,t,0)}else if(t<0&&e>=0){let i=this.context.getImageData(-t,0,h[2].width,h[2].height);this.context.putImageData(i,0,e)}else if(t>=0&&e>=0){let i=this.context.getImageData(0,0,h[3].width,h[3].height);this.context.putImageData(i,t,e)}this.offsetX+=t,this.offsetY+=e,this.cleanX+=t,this.cleanY+=e,this.clampCleanRect(),this.updateDirty()}zoom(t,e,i){let s=t/this.canvas.width,h=e/this.canvas.height,a=this.viewport.x+this.viewport.width*s,n=this.viewport.y+this.viewport.height*h;if(this.viewport.width*=i,this.viewport.height*=i,this.viewport.x=a-this.viewport.width*s,this.viewport.y=n-this.viewport.height*h,i>1){let t=1/i;this.context.drawImage(this.canvas,this.canvas.width*s-this.canvas.width*s*t,this.canvas.height*h-this.canvas.height*h*t,this.canvas.width*t,this.canvas.height*t)}else this.context.drawImage(this.canvas,this.canvas.width*s-this.canvas.width*s*i,this.canvas.height*h-this.canvas.height*h*i,this.canvas.width*i,this.canvas.height*i,0,0,this.canvas.width,this.canvas.height);this.update()}resize(t,e){let i=this.context.fillStyle;this.viewport.width*=t/this.canvas.width,this.viewport.height*=e/this.canvas.height,this.canvas.width=t,this.canvas.height=e,this.context.fillStyle=i,this.update()}clearWork(){this.work.length=0}queueWork(t){let e=this.freeWorkers.pop();null!=e?(t.pixels=e[1].buffer,e[0].postMessage(t,[t.pixels])):this.work.push(t)}clampCleanRect(){this.cleanX<0&&(this.cleanW+=this.cleanX,this.cleanX=0),this.cleanY<0&&(this.cleanH+=this.cleanY,this.cleanY=0),this.cleanW+this.cleanX>this.canvas.width&&(this.cleanW=this.canvas.width-this.cleanX),this.cleanH+this.cleanY>this.canvas.height&&(this.cleanH=this.canvas.height-this.cleanY),this.cleanW<0&&(this.cleanW=0),this.cleanH<0&&(this.cleanH=0)}}},937:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.displayCoordinates=void 0;let i=document.getElementById("coord-x"),s=document.getElementById("coord-y");e.displayCoordinates=function(t,e){i.textContent=`Re: ${t.toFixed(15)}`,s.textContent=`Im: ${e.toFixed(15)}`}},627:(t,e,i)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.resetConfigs=void 0;const s=i(305);var h=[];function a(t,e){let i=Number(t.min),s=Number(t.max),a=Number(t.value);h.push(t);let n=()=>{let h=Number(t.value);""===t.value&&(h=a,t.value=h.toString()),h<i?(h=i,t.value=h.toString()):h>s&&(h=s,t.value=h.toString()),h>=i&&h<=s&&e(h)};t.addEventListener("input",n),t.addEventListener("change",n)}e.resetConfigs=function(){h.forEach((t=>{t.value="";let e=document.createEvent("Event");e.initEvent("input"),t.dispatchEvent(e)}))},a(document.getElementById("limit"),(t=>{let e=s.view.limit!=t;s.view.limit=t,e&&s.view.queueUpdate()})),a(document.getElementById("escaper"),(t=>{let e=s.view.escapeRadius!=t;s.view.escapeRadius=t,e&&s.view.queueUpdate()}))},28:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.GestureDecoder=void 0,e.GestureDecoder=class{constructor(t){this.cache=[],this.x=0,this.y=0,this.delta=0,t.addEventListener("pointerdown",this.handlePointerDown.bind(this)),t.addEventListener("pointermove",this.handlePointerMove.bind(this)),t.addEventListener("pointerup",this.handlePointerUp.bind(this)),t.addEventListener("pointercancel",this.handlePointerUp.bind(this)),t.addEventListener("pointerout",this.handlePointerUp.bind(this)),t.addEventListener("pointerleave",this.handlePointerUp.bind(this))}on(t,e){switch(t){case"dragstart":this.dragStartHandler=e;break;case"dragupdate":this.dragUpdateHandler=e;break;case"dragstop":this.dragStopHandler=e;break;case"zoomstart":this.zoomStartHandler=e;break;case"zoomupdate":this.zoomUpdateHandler=e;break;case"zoomstop":this.zoomStopHandler=e}}handlePointerDown(t){switch(this.cache.push(t),this.cache.length){case 1:this.startDrag();break;case 2:this.stopDrag(),this.startZoom();break;case 3:this.stopZoom()}}handlePointerMove(t){for(var e=0;e<this.cache.length;++e)if(this.cache[e].pointerId==t.pointerId){this.cache[e]=t;break}switch(this.cache.length){case 1:this.updateDrag();break;case 2:this.updateZoom()}}handlePointerUp(t){let e=!1;switch(this.cache.length){case 1:this.stopDrag();break;case 2:this.stopZoom(),e=!0;break;case 3:this.startZoom()}for(var i=0;i<this.cache.length;++i)if(this.cache[i].pointerId==t.pointerId){this.cache.splice(i,1);break}e&&this.startDrag()}startDrag(){this.x=this.cache[0].clientX,this.y=this.cache[0].clientY,null!=this.dragStartHandler&&this.dragStartHandler({x:this.cache[0].clientX-this.x,y:this.cache[0].clientY-this.y})}updateDrag(){null!=this.dragUpdateHandler&&this.dragUpdateHandler({x:this.cache[0].clientX-this.x,y:this.cache[0].clientY-this.y})}stopDrag(){null!=this.dragStopHandler&&this.dragStopHandler({x:this.cache[0].clientX-this.x,y:this.cache[0].clientY-this.y})}startZoom(){let t=this.cache[0].clientX-this.cache[1].clientX,e=this.cache[0].clientY-this.cache[1].clientY;if(this.delta=Math.sqrt(t*t+e*e),null!=this.zoomStartHandler){let t=(this.cache[0].clientX+this.cache[1].clientX)/2,e=(this.cache[0].clientY+this.cache[1].clientY)/2;this.zoomStartHandler({x:t,y:e,scale:1})}}updateZoom(){if(null!=this.zoomUpdateHandler){let t=(this.cache[0].clientX+this.cache[1].clientX)/2,e=(this.cache[0].clientY+this.cache[1].clientY)/2,i=this.cache[0].clientX-this.cache[1].clientX,s=this.cache[0].clientY-this.cache[1].clientY,h=Math.sqrt(i*i+s*s);this.zoomUpdateHandler({x:t,y:e,scale:h/this.delta})}}stopZoom(){if(null!=this.zoomStopHandler){let t=(this.cache[0].clientX+this.cache[1].clientX)/2,e=(this.cache[0].clientY+this.cache[1].clientY)/2,i=this.cache[0].clientX-this.cache[1].clientX,s=this.cache[0].clientY-this.cache[1].clientY,h=Math.sqrt(i*i+s*s);this.zoomStopHandler({x:t,y:e,scale:h/this.delta})}}}},305:(t,e,i)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.view=void 0;const s=i(447),h=i(28),a=i(937);let n=0,c=0,o=1;function l(t){n==t.x&&c==t.y||p.pan(Math.round(t.x-n),Math.round(t.y-c)),n=t.x,c=t.y}function r(t){l(t),t.scale!=o&&p.zoom(t.x,t.y,o/t.scale),o=t.scale}let d=document.getElementById("canvas");d.width=window.innerWidth,d.height=window.innerHeight;let p=new s.default(d);e.view=p,window.addEventListener("resize",(()=>p.resize(window.innerWidth,window.innerHeight)));let u=new h.GestureDecoder(d);u.on("dragstart",(t=>{n=t.x,c=t.y})),u.on("dragupdate",l),u.on("dragstop",l),u.on("zoomstart",(t=>{n=t.x,c=t.y,o=t.scale})),u.on("zoomupdate",r),u.on("zoomstop",r),d.addEventListener("wheel",(t=>{p.zoom(t.clientX,t.clientY,1+.001*t.deltaY)})),d.addEventListener("mousemove",(t=>{a.displayCoordinates(p.viewport.x+t.clientX/d.width*p.viewport.width,p.viewport.y+t.clientY/d.height*p.viewport.height)})),d.addEventListener("mouseleave",(()=>{a.displayCoordinates(p.viewport.x+.5*p.viewport.width,p.viewport.y+.5*p.viewport.height)})),p.resize(window.innerWidth,window.innerHeight),a.displayCoordinates(p.viewport.x+.5*p.viewport.width,p.viewport.y+.5*p.viewport.height)}},e={};function i(s){var h=e[s];if(void 0!==h)return h.exports;var a=e[s]={exports:{}};return t[s](a,a.exports,i),a.exports}(()=>{const t=i(305),e=i(627);let s=document.getElementById("side-menu"),h=document.getElementById("toggle-menu"),a=document.getElementById("toggle-menu-arrow");h.addEventListener("click",(function(){"280pt"===s.style.width?(s.style.width="0",h.style.marginRight="20pt",a.classList.remove("right"),a.classList.add("left")):(s.style.width="280pt",s.getBoundingClientRect().width,h.style.marginRight="300pt",a.classList.remove("left"),a.classList.add("right"))})),document.getElementById("redraw").onclick=()=>t.view.update(),document.getElementById("reset").onclick=()=>{t.view.viewport=t.view.defaultViewport,e.resetConfigs(),t.view.update()}})(),(()=>{let t=document.getElementById("toggle_fs");document.fullscreenEnabled?t.onclick=()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}:t.remove()})()})();