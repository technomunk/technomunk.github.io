(()=>{"use strict";var e,t,r,n,o,i,a,s={560:(e,t,r)=>{r.e(887).then(r.bind(r,887)).catch((e=>{console.error("Error import gol"),console.trace(e)}))}},u={};function c(e){var t=u[e];if(void 0!==t)return t.exports;var r=u[e]={id:e,loaded:!1,exports:{}};return s[e](r,r.exports,c),r.loaded=!0,r.exports}c.m=s,c.c=u,c.d=(e,t)=>{for(var r in t)c.o(t,r)&&!c.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},c.f={},c.e=e=>Promise.all(Object.keys(c.f).reduce(((t,r)=>(c.f[r](e,t),t)),[])),c.u=e=>e+".js",c.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),c.hmd=e=>((e=Object.create(e)).children||(e.children=[]),Object.defineProperty(e,"exports",{enumerable:!0,set:()=>{throw new Error("ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: "+e.id)}}),e),c.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),e={},t="technomunk.github.io:",c.l=(r,n,o,i)=>{if(e[r])e[r].push(n);else{var a,s;if(void 0!==o)for(var u=document.getElementsByTagName("script"),l=0;l<u.length;l++){var d=u[l];if(d.getAttribute("src")==r||d.getAttribute("data-webpack")==t+o){a=d;break}}a||(s=!0,(a=document.createElement("script")).charset="utf-8",a.timeout=120,c.nc&&a.setAttribute("nonce",c.nc),a.setAttribute("data-webpack",t+o),a.src=r),e[r]=[n];var p=(t,n)=>{a.onerror=a.onload=null,clearTimeout(f);var o=e[r];if(delete e[r],a.parentNode&&a.parentNode.removeChild(a),o&&o.forEach((e=>e(n))),t)return t(n)},f=setTimeout(p.bind(null,void 0,{type:"timeout",target:a}),12e4);a.onerror=p.bind(null,a.onerror),a.onload=p.bind(null,a.onload),s&&document.head.appendChild(a)}},c.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},(()=>{var e;c.g.importScripts&&(e=c.g.location+"");var t=c.g.document;if(!e&&t&&(t.currentScript&&(e=t.currentScript.src),!e)){var r=t.getElementsByTagName("script");r.length&&(e=r[r.length-1].src)}if(!e)throw new Error("Automatic publicPath is not supported in this browser");e=e.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^\/]+$/,"/"),c.p=e})(),(()=>{var e={772:0};c.f.j=(t,r)=>{var n=c.o(e,t)?e[t]:void 0;if(0!==n)if(n)r.push(n[2]);else{var o=new Promise(((r,o)=>n=e[t]=[r,o]));r.push(n[2]=o);var i=c.p+c.u(t),a=new Error;c.l(i,(r=>{if(c.o(e,t)&&(0!==(n=e[t])&&(e[t]=void 0),n)){var o=r&&("load"===r.type?"missing":r.type),i=r&&r.target&&r.target.src;a.message="Loading chunk "+t+" failed.\n("+o+": "+i+")",a.name="ChunkLoadError",a.type=o,a.request=i,n[1](a)}}),"chunk-"+t,t)}};var t=(t,r)=>{var n,o,[i,a,s]=r,u=0;if(i.some((t=>0!==e[t]))){for(n in a)c.o(a,n)&&(c.m[n]=a[n]);s&&s(c)}for(t&&t(r);u<i.length;u++)o=i[u],c.o(e,o)&&e[o]&&e[o][0](),e[i[u]]=0},r=self.webpackChunktechnomunk_github_io=self.webpackChunktechnomunk_github_io||[];r.forEach(t.bind(null,0)),r.push=t.bind(null,r.push.bind(r))})(),o={},i={92:function(){return{"./wasm_game_of_life_bg.js":{__wbg_random_727732de4695ec15:function(){return void 0===r&&(r=c.c[314].exports),r.T6()},__wbindgen_throw:function(e,t){return void 0===n&&(n=c.c[314].exports),n.Or(e,t)}}}}},a={887:[92]},c.w={},c.f.wasm=function(e,t){(a[e]||[]).forEach((function(r,n){var a=o[r];if(a)t.push(a);else{var s,u=i[r](),l=fetch(c.p+""+{887:{92:"d4570980da58fed16021"}}[e][r]+".module.wasm");s=u&&"function"==typeof u.then&&"function"==typeof WebAssembly.compileStreaming?Promise.all([WebAssembly.compileStreaming(l),u]).then((function(e){return WebAssembly.instantiate(e[0],e[1])})):"function"==typeof WebAssembly.instantiateStreaming?WebAssembly.instantiateStreaming(l,u):l.then((function(e){return e.arrayBuffer()})).then((function(e){return WebAssembly.instantiate(e,u)})),t.push(o[r]=s.then((function(e){return c.w[r]=(e.instance||e).exports})))}}))},c(560)})();