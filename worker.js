importScripts('https://cdn.jsdelivr.net/npm/@sythos/js_barcode_universal@1.6.3/bundle/sythos-barcode.js');
const S=globalThis.SythosBarcode; self.postMessage({type:'ready',ok:!!S});

function gray(src){const g=new Uint8Array(src.length/4);for(let i=0,j=0;i<g.length;i++,j+=4)g[i]=Math.round(.299*src[j]+.587*src[j+1]+.114*src[j+2]);return g}
function otsu(g){const h=new Uint32Array(256);for(const v of g)h[v]++;let sum=0,total=g.length;for(let i=0;i<256;i++)sum+=i*h[i];let wb=0,sb=0,best=-1,t=128;for(let i=0;i<256;i++){wb+=h[i];if(!wb)continue;const wf=total-wb;if(!wf)break;sb+=i*h[i];const mb=sb/wb,mf=(sum-sb)/wf;const q=wb*wf*(mb-mf)*(mb-mf);if(q>best){best=q;t=i}}return t}
function comps(bin,w,h){const seen=new Uint8Array(w*h),out=[];const qx=new Int32Array(w*h),qy=new Int32Array(w*h);for(let sy=0;sy<h;sy++)for(let sx=0;sx<w;sx++){const si=sy*w+sx;if(!bin[si]||seen[si])continue;let head=0,tail=0;qx[tail]=sx;qy[tail]=sy;tail++;seen[si]=1;let minx=sx,maxx=sx,miny=sy,maxy=sy,n=0;while(head<tail){const x=qx[head],y=qy[head];head++;n++;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const j=yy*w+xx;if(bin[j]&&!seen[j]){seen[j]=1;qx[tail]=xx;qy[tail]=yy;tail++}}}const bw=maxx-minx+1,bh=maxy-miny+1;if(n>=3&&n<=180&&bw<=18&&bh<=18&&bw>=2&&bh>=2){const ar=bw/bh;if(ar>.45&&ar<2.2)out.push({x:(minx+maxx)/2,y:(miny+maxy)/2,w:bw,h:bh,a:n})}}return out}
function largestDarkPanel(g,w,h){
 // Detect a broad dark panel by row/column occupancy; do not reuse the tiny-dot
 // component filter here (that filter intentionally rejects large components).
 const t=Math.min(145,Math.max(55,otsu(g)));const row=new Uint32Array(h),col=new Uint32Array(w);
 for(let y=0,i=0;y<h;y++)for(let x=0;x<w;x++,i++)if(g[i]<t){row[y]++;col[x]++;}
 const rowMin=Math.max(8,Math.floor(w*.22)),colMin=Math.max(8,Math.floor(h*.22));
 let y0=-1,y1=-1,x0=-1,x1=-1;
 for(let y=0;y<h;y++)if(row[y]>=rowMin){if(y0<0)y0=y;y1=y;}
 for(let x=0;x<w;x++)if(col[x]>=colMin){if(x0<0)x0=x;x1=x;}
 if(x0<0||y0<0)return null;
 const pw=x1-x0+1,ph=y1-y0+1;
 if(pw<Math.max(80,w*.25)||ph<Math.max(45,h*.16))return null;
 return{x:x0,y:y0,w:pw,h:ph};
}
function crop(g,w,h,x,y,cw,ch){const o=new Uint8Array(cw*ch);for(let yy=0;yy<ch;yy++)o.set(g.subarray((y+yy)*w+x,(y+yy)*w+x+cw),yy*cw);return[o,cw,ch]}
function dotCandidates(g,w,h){let t=otsu(g);const ts=[Math.max(70,t-15),t,Math.min(230,t+15),150,180,200];let best=[];for(const th of ts){const b=new Uint8Array(w*h);for(let i=0;i<g.length;i++)b[i]=g[i]>=th?1:0;const c=comps(b,w,h);if(c.length>best.length)best=c}return best}
function clusterRows(points,k){if(points.length<k)return null;let ys=points.map(p=>p.y);let mn=Math.min(...ys),mx=Math.max(...ys);let centers=[];for(let i=0;i<k;i++)centers.push(mn+(i+.5)*(mx-mn)/k);for(let it=0;it<20;it++){const sums=new Array(k).fill(0),cnt=new Array(k).fill(0);for(const y of ys){let bi=0,bd=1e9;for(let i=0;i<k;i++){const d=Math.abs(y-centers[i]);if(d<bd){bd=d;bi=i}}sums[bi]+=y;cnt[bi]++}let changed=false;for(let i=0;i<k;i++)if(cnt[i]){const nc=sums[i]/cnt[i];if(Math.abs(nc-centers[i])>.05)changed=true;centers[i]=nc}if(!changed)break}centers.sort((a,b)=>a-b);const rows=centers.map(c=>points.filter(p=>Math.abs(p.y-c)<=Math.max(4,(mx-mn)/(k*2.2))));const counts=rows.map(r=>r.length);const used=rows.flat().length;let resid=0,n=0;for(let i=0;i<rows.length;i++)for(const p of rows[i]){resid+=Math.abs(p.y-centers[i]);n++}return{centers,rows,counts,used,resid:(n?resid/n:999)}}
function median(a){if(!a.length)return 0;a=[...a].sort((x,y)=>x-y);const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2}
function fitGrid(points){let best=null;for(let k=5;k<=9;k++){const r=clusterRows(points,k);if(!r)continue;const pitchY=median(r.centers.slice(1).map((v,i)=>v-r.centers[i]));if(!pitchY)continue;const coverage=r.used/points.length;const score=coverage*100-r.resid*8-Math.abs((pitchY/median(r.centers.slice(1).map((v,i)=>v-r.centers[i])))-1)*10;if(!best||score>best.score)best={...r,pitchY,score,k}}if(!best)return null;let xdiff=[];for(const row of best.rows){const xs=row.map(p=>p.x).sort((a,b)=>a-b);for(let i=1;i<xs.length;i++){const d=xs[i]-xs[i-1];if(d>4&&d<40)xdiff.push(d)}}let pitchX=median(xdiff);if(!pitchX) return null; // reject large gaps; use lower quantile via repeated differences
const allx=points.map(p=>p.x),xmin=Math.min(...allx),xmax=Math.max(...allx);let W=Math.round((xmax-xmin)/pitchX)+1;if(W<5)W=5;if(W>200)W=200;let bestW=W; // DotCode requires W+H odd
if(((bestW+best.k)&1)===0)bestW+=1;if(bestW>200)bestW-=2;
return {rows:best.rows,centers:best.centers,pitchY,pitchX,W:bestW,H:best.k,xmin,xmax,score:best.score,counts:best.counts}}
function makeRaster(fit,points,scale=3,inv=false){const W=fit.W,H=fit.H,p=fit.pitchX,py=fit.pitchY;const margin=3;const mw=(W+margin*2)*scale,mh=(H+margin*2)*scale;const d=new Uint8ClampedArray(mw*mh*4);d.fill(inv?0:255);const mark=inv?255:0;for(let r=0;r<H;r++){const yc=fit.centers[r];const off=(r%2)*p/2;for(const pt of points){if(Math.abs(pt.y-yc)>Math.max(5,py*.42))continue;let c=Math.round((pt.x-fit.xmin-off)/p);if(c<0||c>=W)continue;const x=Math.round((c+margin)*scale),y=Math.round((r+margin)*scale);for(let yy=0;yy<scale;yy++)for(let xx=0;xx<scale;xx++){const i=((y+yy)*mw+(x+xx))*4;d[i]=d[i+1]=d[i+2]=mark;d[i+3]=255}}}return{data:d,width:mw,height:mh}}
function decodeRaster(img){if(!S)return[];try{return S.decode(img,{formats:['dotcode']})||[]}catch(e){return[]}}
function decode(src,w,h){const g=gray(src);const panel=largestDarkPanel(g,w,h);let pg,pw,ph,pinfo;if(panel){const x=Math.max(0,Math.floor(panel.x-panel.w*.01)),y=Math.max(0,Math.floor(panel.y-panel.h*.01));const x2=Math.min(w,Math.ceil(panel.x+panel.w*1.01)),y2=Math.min(h,Math.ceil(panel.y+panel.h*1.01));[pg,pw,ph]=crop(g,w,h,x,y,x2-x,y2-y);pinfo={x,y,w:pw,h:ph}}else{pg=g;pw=w;ph=h;pinfo=null}
// Dot band: lower part of dark panel, avoiding the text line.
const y0=Math.floor(ph*.60), y1=Math.floor(ph*.99), x0=Math.floor(pw*.02), x1=Math.floor(pw*.98);const [dg,dw,dh]=crop(pg,pw,ph,x0,y0,x1-x0,y1-y0);const pts=dotCandidates(dg,dw,dh);if(pts.length<20)return{hit:null,stage:'dot-extract',panel:pinfo,candidates:pts.length};const fit=fitGrid(pts);if(!fit)return{hit:null,stage:'grid-fit',panel:pinfo,candidates:pts.length};
// Map several nearby x origins/row offsets and both polarities. This is cheap because the raster is small.
const tries=[];for(const dx of [-.35,-.15,0,.15,.35]){for(const dy of [-.25,0,.25]){const f={...fit,xmin:fit.xmin+dx*fit.pitchX};for(const inv of [false,true]){const im=makeRaster(f,pts,3,inv);tries.push({im,inv,dx,dy})}}}
for(const t of tries){const hits=decodeRaster(t.im);const hit=hits.find(x=>x&&x.text);if(hit)return{hit,stage:'extracted-grid',panel:pinfo,candidates:pts.length,grid:fit,variant:{inv:t.inv,dx:t.dx}}}
return{hit:null,stage:'extracted-grid-no-read',panel:pinfo,candidates:pts.length,grid:fit,counts:fit.counts}};
self.onmessage=e=>{if(e.data?.type!=='scan')return;try{const r=decode(new Uint8ClampedArray(e.data.data),e.data.width,e.data.height);self.postMessage({type:'result',ok:true,...r})}catch(err){self.postMessage({type:'result',ok:false,error:String(err?.message||err)})}};
