"use strict";(self.webpackChunktechnomunk_github_io=self.webpackChunktechnomunk_github_io||[]).push([[227],{227:(e,t,r)=>{r.r(t);var n=r(314),o=r(92);const i=document.getElementById("main-canvas"),s=i.getContext("2d"),l=16;let a=Math.floor(window.innerWidth/l),c=Math.floor(window.innerHeight/l);i.width=a*l,i.height=c*l;let h=n.Pd.random(a,c),d="full",u=Date.now();function f(e,t,r){const n=r*a+t,o=1<<n%8;return(e[Math.floor(n/8)]&o)===o}function _(){const e=new Uint8Array(o.memory.buffer,h.cells_ptr(),h.cells_size());s.beginPath();for(let t=0;t<c;++t)for(let r=0;r<a;++r)s.fillStyle=f(e,r,t)?"#000000":"#FFFFFF",s.fillRect(r*l,t*l,15,15);s.stroke()}window.addEventListener("resize",(()=>{a=Math.floor(window.innerWidth/l),c=Math.floor(window.innerHeight/l),i.width=a*l,i.height=c*l,h.free(),h=n.Pd.random(a,c),d="full"})),i.addEventListener("click",(e=>{const t=i.getBoundingClientRect(),{x:r,y:n}=(s=t,{x:((o=e).x-s.x)/s.width,y:(o.y-s.y)/s.height});var o,s;e.ctrlKey?h.spawn_glider(Math.floor(r*a),Math.floor(n*c)):h.toggle(Math.floor(r*a),Math.floor(n*c)),d="cells"})),window.addEventListener("keypress",(e=>{" "==e.key&&(h.tick(),d="cells")})),function e(){const t=Date.now();switch(t-u>=500&&(h.tick(),u=t,"full"!=d&&(d="cells")),d){case"full":!function(){s.strokeStyle="#CCCCCC";for(let e=0;e<=a;++e)s.moveTo(e*l,0),s.lineTo(e*l,l*c);for(let e=0;e<=c;++e)s.moveTo(0,e*l),s.lineTo(l*a,e*l);s.stroke()}(),_();break;case"cells":_()}requestAnimationFrame(e)}()},314:(e,t,r)=>{r.d(t,{Pd:()=>s,T6:()=>l,Or:()=>a});var n=r(92);e=r.hmd(e);let o=new("undefined"==typeof TextDecoder?(0,e.require)("util").TextDecoder:TextDecoder)("utf-8",{ignoreBOM:!0,fatal:!0});o.decode();let i=null;class s{static __wrap(e){const t=Object.create(s.prototype);return t.ptr=e,t}__destroy_into_raw(){const e=this.ptr;return this.ptr=0,e}free(){const e=this.__destroy_into_raw();n.__wbg_universe_free(e)}tick(){n.universe_tick(this.ptr)}static empty(e,t){var r=n.universe_empty(e,t);return s.__wrap(r)}static random(e,t){var r=n.universe_random(e,t);return s.__wrap(r)}width(){return n.universe_width(this.ptr)>>>0}height(){return n.universe_height(this.ptr)>>>0}cells_ptr(){return n.universe_cells_ptr(this.ptr)}cells_size(){return n.universe_cells_size(this.ptr)>>>0}toggle(e,t){n.universe_toggle(this.ptr,e,t)}spawn_glider(e,t){n.universe_spawn_glider(this.ptr,e,t)}}const l="function"==typeof Math.random?Math.random:("Math.random",()=>{throw new Error("Math.random is not defined")});function a(e,t){throw new Error((r=e,s=t,o.decode((null!==i&&i.buffer===n.memory.buffer||(i=new Uint8Array(n.memory.buffer)),i).subarray(r,r+s))));var r,s}},92:(e,t,r)=>{var n=r.w[e.id];e.exports=n,r(314),n[""]()}}]);