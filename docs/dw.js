(()=>{"use strict";const t=1/6;function a(t,a,i){for(var e=0,d=0,h=0,s=0,n=0;h+n<i.escapeRadius&&e<i.limit;)s=2*d*s+a,h=(d=h-n+t)*d,n=s*s,++e;return[e,[d,s]]}Math.log(2),onmessage=i=>{!function(i,e,d){let h=i.data;var s,n,o,r=0,g=0,c=0,l=[0,0,0],f=0,w=0,m=0,p=0,u=0;for(w=0;w<i.height;++w)for(c=e.y+e.height*w/i.height,f=0;f<i.width;++f)g=e.x+e.width*f/i.width,[m,[p,u]]=a(g,c,d),s=m,n=d.limit,o=void 0,l=s===n?[0,0,0]:(o=s/n)<t?[255,o/t*255,0]:o<2*t?[255*(2-o/t),255,0]:o<.5?[0,255,(o-2*t)/t*255]:o<4*t?[0,255*(2-(o-2*t)/t),255]:o<5*t?[(o-4*t)/t*255,0,255]:[255,0,255*(2-(o-4*t)/t)],h[r++]=l[0],h[r++]=l[1],h[r++]=l[2],h[r++]=255}(new ImageData(new Uint8ClampedArray(i.data.pixels),i.data.width,i.data.height),i.data.rect,i.data.config),postMessage(i.data,[i.data.pixels])}})();